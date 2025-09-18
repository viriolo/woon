import React from 'react';
import { HeartIcon } from '../../../components/icons';

const DecorationCard = ({ decoration }) => {
  return (
    <div className="bg-neutral-800 rounded-lg overflow-hidden border border-neutral-700">
      <img
        src={decoration.imageUrl}
        alt={decoration.title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <h3 className="font-bold text-special-secondary mb-2">
          {decoration.title}
        </h3>
        <p className="text-sm text-neutral-400 mb-2">
          by {decoration.author}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex items-center text-special-primary">
            <HeartIcon className="w-5 h-5 mr-1" />
            <span className="font-bold">{decoration.likes}</span>
          </div>
          <span className="text-xs text-neutral-500">
            {decoration.category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default DecorationCard;