from datetime import datetime
from decimal import Decimal
import json
import logging
import httpx
import os
from chatbot.database.database import db
from pinecone import Pinecone
from openai import OpenAI

openai = OpenAI()
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("courses")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        elif isinstance(obj, datetime):
            return obj.isoformat()
        return super(CustomJSONEncoder, self).default(obj)

class FunctionHandler:
    def __init__(self):
        self.google_maps_api_key = os.getenv('GOOGLE_MAPS_API_KEY')

    def handle_search_nearby_places(self, tool):
        arguments = json.loads(tool['function']['arguments'])
        location = arguments['location']
        radius = arguments['radius']
        place_type = arguments['type']
        keyword = arguments.get('keyword', '')
        language = arguments.get('language', '')
        
        url = (
            f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?"
            f"location={location}&radius={radius}&type={place_type}&key={self.google_maps_api_key}"
        )
        if keyword:
            url += f"&keyword={keyword}"
        if language:
            url += f"&language={language}"
            
        response = httpx.get(url)
        if response.status_code == 200:
            places = response.json().get('results', [])
            output = places if places else {"error": "No places found"}
        else:
            output = {"error": f"API request failed with status code {response.status_code}"}
            
        return {
            "tool_call_id": tool['id'],
            "output": json.dumps(output)
        }

    def handle_get_distance_matrix(self, tool):
        arguments = json.loads(tool['function']['arguments'])
        origins = arguments['origins']
        destinations = arguments['destinations']
        mode = arguments.get('mode', 'driving')
        optional_params = {
            'language': arguments.get('language', ''),
            'avoid': arguments.get('avoid', ''),
            'units': arguments.get('units', ''),
            'departure_time': arguments.get('departure_time', ''),
            'arrival_time': arguments.get('arrival_time', ''),
            'traffic_model': arguments.get('traffic_model', ''),
            'transit_mode': arguments.get('transit_mode', ''),
            'transit_routing_preference': arguments.get('transit_routing_preference', '')
        }
        
        url = (
            f"https://maps.googleapis.com/maps/api/distancematrix/json?"
            f"origins={origins}&destinations={destinations}&mode={mode}&key={self.google_maps_api_key}"
        )
        
        for param, value in optional_params.items():
            if value:
                url += f"&{param}={value}"
                
        response = httpx.get(url)
        if response.status_code == 200:
            output = response.json()
        else:
            output = {"error": f"API request failed with status code {response.status_code}"}
            
        return {
            "tool_call_id": tool['id'],
            "output": json.dumps(output)
        }

    class CustomJSONEncoder(json.JSONEncoder):
        def default(self, o):
            return str(o)

    def handle_add_dishes_to_order(self, tool):
        try:
            arguments = json.loads(tool['function']['arguments'])
            dishes = arguments.get('dishes', [])
            logger.info(f"Received arguments: {arguments}")

            processed_dishes = []
            not_found_dishes = []
            
            for dish in dishes:
                dish_name = dish.get('dish_name')
                if not dish_name:
                    logger.warning("Dish entry without a name found, skipping.")
                    continue

                logger.info(f"Processing dish: {dish_name}")
                
                try:
                    response = openai.embeddings.create(
                        input=dish_name,
                        model="text-embedding-3-large"
                    )
                    query_embedding = response.data[0].embedding

                    # Query Pinecone using the embedding
                    search_response = index.query(
                        namespace="ns1",
                        vector=query_embedding,
                        top_k=1,
                        include_metadata=True,
                        score_threshold=0.6
                    )
                    logger.info(f"Pinecone query response for '{dish_name}': {search_response}")

                    # Check if any matches were found
                    if search_response.get('matches') and search_response['matches'][0]['score'] >= 0.6:
                        # Parse the metadata JSON string for the first match
                        metadata = search_response['matches'][0]['metadata']
                        logger.info(f"Found metadata for '{dish_name}': {metadata}")

                        # Convert JSON string from metadata back to dictionary
                        dish_data = json.loads(metadata.get('dish_data'))
                        processed_dish = {
                            'original_name': dish_name,  # Keep the original name
                            'name': dish_data['dish_name'],
                            'price': dish_data.get('price'),
                            'category': dish_data.get('category'),
                            'description': dish_data.get('description'),
                            'nutritional_info': dish_data.get('nutritional_info'),
                            'photo_url': dish_data.get('photo_url'),
                            'similarity_score': search_response['matches'][0]['score']
                        }
                        processed_dishes.append(processed_dish)
                        logger.info(f"Processed dish added: {processed_dish}")
                    else:
                        not_found_dishes.append(f"{dish_name} ({dish_name})")
                        logger.warning(f"No close matches found for dish: {dish_name}")

                except Exception as query_error:
                    logger.error(f"Error during search for '{dish_name}': {query_error}")
                    not_found_dishes.append(dish_name)

            # Prepare the response message
            if not processed_dishes and not_found_dishes:
                output = {
                    'status': 'error',
                    'message': f"Could not find the following dish(es) in our menu: {', '.join(not_found_dishes)}",
                    'dishes': []
                }
                logger.info(f"Response output: {output}")
            elif not_found_dishes:
                output = {
                    'status': 'partial_success',
                    'message': (
                        f"Added some dishes to the order, but couldn't find close matches for: {', '.join(not_found_dishes)}. "
                        "Would you like to order anything else?"
                    ),
                    'dishes': processed_dishes
                }
                logger.info(f"Response output: {output}")
            else:
                output = {
                    'status': 'success',
                    'message': 'Successfully added all dishes to your order. Would you like to order anything else?',
                    'dishes': processed_dishes
                }
                logger.info(f"Response output: {output}")
                    
        except json.JSONDecodeError:
            output = {
                'status': 'error',
                'message': 'Invalid JSON format in the request'
            }
            logger.error("JSON decoding error in arguments.")
        except Exception as e:
            output = {
                'status': 'error',
                'message': f'Failed to add dishes to order: {str(e)}'
            }
            logger.error(f"General error in processing dishes: {e}")
        
        return {
            "tool_call_id": tool['id'],
            "output": json.dumps(output, cls=CustomJSONEncoder)
        }
        
    def handle_function_call(self, tool_calls):
        for tool in tool_calls:
            function_name = tool['function']['name']
            handler_method = getattr(self, f'handle_{function_name}', None)
            
            if handler_method:
                tool_output = handler_method(tool)
                return tool_output, tool["thread_id"], tool["run_id"]
        
        return None, None, None