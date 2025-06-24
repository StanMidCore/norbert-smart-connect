
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
    onError('Impossible de charger le QR code. Veuillez réessayer.');
  };

  const handleImageLoad = () => {
    console.log('✅ QR code chargé avec succès');
  };

  // Améliorer la gestion du format QR code
  const getQRCodeSrc = () => {
    if (!qrCode) return '';
    
    console.log('🔍 QR code reçu:', qrCode.substring(0, 100) + '...');
    
    // Si c'est déjà une URL data complète
    if (qrCode.startsWith('data:image/')) {
      return qrCode;
    }
    
    // Si c'est un format base64 avec préfixe
    if (qrCode.includes('data:image')) {
      return qrCode;
    }
    
    // Si c'est juste le contenu base64 brut (format Unipile)
    // Essayer de détecter le format d'image
    let mimeType = 'image/png';
    if (qrCode.startsWith('/9j/') || qrCode.startsWith('iVBOR')) {
      mimeType = qrCode.startsWith('/9j/') ? 'image/jpeg' : 'image/png';
    }
    
    return `data:${mimeType};base64,${qrCode}`;
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
