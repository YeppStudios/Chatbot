import json
from avatar.services.function_handlers import FunctionHandler
from openai import OpenAI

openai = OpenAI()
function_handler = FunctionHandler()

def serialize_event(event):
    try:
        if hasattr(event, 'data'):
            # Handle RunStepDeltaEvent for function calls
            if hasattr(event.data, 'delta') and hasattr(event.data.delta, 'step_details') and hasattr(event.data.delta.step_details, 'tool_calls'):
                tool_calls = event.data.delta.step_details.tool_calls
                for tool_call in tool_calls:
                    if hasattr(tool_call, 'function') and tool_call.function:
                        function_name = getattr(tool_call.function, 'name', None)
                        function_arguments = getattr(tool_call.function, 'arguments', None)
                        if function_name:
                            return {
                                'type': 'function_call',
                                'data': {
                                    'name': function_name,
                                    'arguments': function_arguments,
                                }
                            }

            # Handle Run event for required actions
            if hasattr(event.data, 'required_action') and event.data.required_action:
                tool_calls = []
                for tool_call in event.data.required_action.submit_tool_outputs.tool_calls:
                    tool_calls.append({
                        'id': tool_call.id,
                        'thread_id': event.data.thread_id,
                        'run_id': event.data.id,
                        'function': {
                            'name': tool_call.function.name,
                            'arguments': tool_call.function.arguments
                        },
                    })
                return {
                    'type': 'tool_action',
                    'data': tool_calls
                }

            # Handle MessageDeltaEvent for text content
            elif hasattr(event.data, 'delta') and hasattr(event.data.delta, 'content'):
                for content_block in event.data.delta.content:
                    if hasattr(content_block, 'type') and content_block.type == 'text':
                        if hasattr(content_block, 'text') and hasattr(content_block.text, 'value'):
                            return {
                                'type': 'text',
                                'data': content_block.text.value
                            }
    except Exception as e:
        print(f"Error processing the event: {e}")
    
    return None

def event_stream(openai_stream):
    buffer = ""
    inside_pattern = False

    try:
        for event in openai_stream:
            value = serialize_event(event)
            if value:
                if value['type'] == 'text':
                    buffer += value['data']
                    while buffer:
                        if inside_pattern:
                            end_idx = buffer.find('】')
                            if end_idx == -1:
                                buffer = ""
                                break
                            else:
                                buffer = buffer[end_idx + 1:]
                                inside_pattern = False
                        else:
                            start_idx = buffer.find('【')
                            if start_idx == -1:
                                yield f"data: {json.dumps(value)}\n\n"
                                buffer = ""
                            else:
                                yield f"data: {json.dumps({'type': 'text', 'data': buffer[:start_idx]})}\n\n"
                                buffer = buffer[start_idx:]
                                inside_pattern = True
                                
                elif value['type'] == 'function_call':
                    yield f"data: {json.dumps(value)}\n\n"

                elif value['type'] == 'tool_action':
                    yield f"data: {json.dumps(value)}\n\n"
                    # Check if any function in tool_action requires backend processing
                    if any(tool['function']['arguments'] and tool['function']['arguments'].strip() != '{}' for tool in value['data']):
                        tool_output, thread_id, run_id = function_handler.handle_function_call(value['data'])
                        if tool_output:
                            yield f"data: {json.dumps({'type': 'tool_outputs', 'data': tool_output})}\n\n"
                            yield from continue_streaming(thread_id, run_id, [tool_output])
    except Exception as e:
        print(str(e))
        yield f"data: {json.dumps({'type': 'error', 'data': str(e)})}\n\n"

def continue_streaming(thread_id, run_id, tool_outputs):
    print(tool_outputs)
    with openai.beta.threads.runs.submit_tool_outputs_stream(
        thread_id=thread_id,
        run_id=run_id,
        tool_outputs=tool_outputs,
    ) as stream:
        for event in stream:
            value = serialize_event(event)
            if value:
                yield f"data: {json.dumps(value)}\n\n"