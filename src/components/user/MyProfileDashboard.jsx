import React from 'react';

const MyProfileDashboard = () => {
  return (
    <div className="p-6 bg-neutral-800 rounded-lg">
      <h2 className="text-xl font-bold text-special-secondary mb-4">Profile Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-neutral-700 p-4 rounded">
          <h3 className="font-semibold">Celebrations Created</h3>
          <p className="text-2xl font-bold text-special-primary">0</p>
        </div>
        <div className="bg-neutral-700 p-4 rounded">
          <h3 className="font-semibold">Total Likes</h3>
          <p className="text-2xl font-bold text-special-primary">0</p>
        </div>
      </div>
    </div>
  );
};

export default MyProfileDashboard;