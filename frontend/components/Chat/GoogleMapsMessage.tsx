import React, { useEffect, useState } from "react";
import Image from "next/image";

const GoogleMapsMessage = ({ message }: { message: any }) => {
  const [display, setDisplay] = useState(false);
  const [places, setPlaces] = useState<any[]>([]);

  useEffect(() => {
    if (message.text) {
      try {
        const parsedMessage = JSON.parse(message.text);
        if (parsedMessage.length > 0) {
          setDisplay(true);
        }
        setPlaces(parsedMessage.slice(0, 3)); // Get the first 3 places
      } catch (error) {
        console.error("Failed to parse message text", error);
      }
    }
  }, [message]);

  const truncateName = (name: string) => {
    if (name.length > 40) {
      return name.substring(0, 40) + "...";
    }
    return name;
  };

  if (display) {
    return (
      <div className="sm:px-7 flex mt-3 text-white w-full">
        <div className="flex items-start mr-3">
          <Image
            src="/profile.png"
            width={60}
            height={60}
            alt="user avatar"
            className="block max-w-7 max-h-7 bg-slate-500 rounded-full border border-white"
          />
        </div>
        <div className="w-full flex flex-wrap gap-2">
          {places.map((place, index) => (
            <a
              href={`https://www.google.com/maps/place/?q=place_id:${place.place_id}`}
              target="_blank"
              rel="noopener noreferrer"
              key={index}
              className="rounded-xl cursor-pointer p-4 border border-slate-500 bg-transparent-black-40 backdrop-blur-sm flex w-full hover:scale-95 hover:border-transparent transition-all duration-300"
            >
              {place.photos && place.photos[0] && (
                <Image
                  src={`https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
                  alt={place.name}
                  width={400}
                  height={300}
                  className="rounded-lg w-48"
                />
              )}
              <div className="ml-6">
                <a className="text-white">
                  <p className="w-full font-medium text-lg">
                    {truncateName(place.name)}
                  </p>
                </a>
                <p className="w-full">{place.vicinity}</p>
              </div>
            </a>
          ))}
        </div>
      </div>
    );
  }
};

export default GoogleMapsMessage;
