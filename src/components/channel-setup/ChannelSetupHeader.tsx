
import React from 'react';

interface ChannelSetupHeaderProps {
  userEmail?: string;
}

const ChannelSetupHeader = ({ userEmail }: ChannelSetupHeaderProps) => {
  return (
    <div className="text-center mb-6">
      <h1 className="text-2xl font-bold text-main mb-2">
        Connecter vos canaux
      </h1>
      <p className="text-main opacity-70">
        Bonjour {userEmail} ! Ajoutez vos comptes pour recevoir et répondre aux messages
      </p>
    </div>
  );
};

export default ChannelSetupHeader;
