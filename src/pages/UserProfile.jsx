import React from 'react';

const UserProfile = ({ userId }) => {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">User Profile</h1>
      <p>Profile page for user: {userId}</p>
      <p>User profile details - to be implemented</p>
    </div>
  );
};

export default UserProfile;