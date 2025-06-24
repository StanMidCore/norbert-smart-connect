
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, RefreshCw } from 'lucide-react';

interface QRCodeDialogProps {
  qrCode: string | null;
  connecting: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onError: (message: string) => void;
}

const QRCodeDialog = ({ qrCode, connecting, onClose, onRegenerate, onError }: QRCodeDialogProps) => {
  const handleImageError = () => {
    console.error('❌ Erreur chargement QR code');
    onError('Format QR code invalide. Veuillez réessayer.');
    onClose();
  };

  const handleImageLoad = () => {
    console.log('✅ QR code chargé avec succès');
  };

  // Vérifier si le QR code est au bon format
  const getQRCodeSrc = () => {
    if (!qrCode) return '';
    
    // Si c'est déjà une URL data complète, l'utiliser directement
    if (qrCode.startsWith('data:image/')) {
      return qrCode;
    }
    
    // Si c'est juste le base64, ajouter le préfixe
    if (qrCode.includes(',')) {
      // Format: "data:image/png;base64,..."
      return `data:image/png;base64,${qrCode.split(',')[1]}`;
    }
    
    // Format simple base64
    return `data:image/png;base64,${qrCode}`;
  };

  return (
    <Dialog open={!!qrCode} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <QrCode className="h-5 w-5 mr-2" />
            Connexion WhatsApp
          </DialogTitle>
          <DialogDescription>
            Scannez ce QR code avec WhatsApp Business sur votre téléphone
          </DialogDescription>
        </DialogHeader>
        <div className="text-center space-y-4">
          <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block">
            <img 
              src={getQRCodeSrc()} 
              alt="QR Code WhatsApp" 
              className="w-64 h-64 mx-auto"
              onError={handleImageError}
              onLoad={handleImageLoad}
            />
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              1. Ouvrez WhatsApp Business sur votre téléphone
            </p>
            <p className="text-sm text-gray-600">
              2. Allez dans Paramètres {">"} Appareils connectés
            </p>
            <p className="text-sm text-gray-600">
              3. Appuyez sur "Connecter un appareil" et scannez ce code
            </p>
          </div>
          <div className="flex gap-2 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRegenerate}
              disabled={connecting === 'whatsapp'}
            >
              {connecting === 'whatsapp' ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Régénérer
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onClose}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
