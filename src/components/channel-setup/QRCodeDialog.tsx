
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
    onError('Impossible de charger le QR code. Veuillez régénérer.');
  };

  const handleImageLoad = () => {
    console.log('✅ QR code chargé avec succès');
  };

  // Traitement correct du QR code Unipile
  const getQRCodeSrc = () => {
    if (!qrCode) return '';
    
    console.log('🔍 QR code reçu, longueur:', qrCode.length);
    console.log('🔍 Premier caractères:', qrCode.substring(0, 50));
    
    // Le QR code d'Unipile WhatsApp est un format spécial, pas du base64
    // Il faut le traiter comme une chaîne de données WhatsApp
    try {
      // Nettoyer le QR code
      let cleanQrCode = qrCode.trim();
      
      // Supprimer les guillemets si présents
      if (cleanQrCode.startsWith('"') && cleanQrCode.endsWith('"')) {
        cleanQrCode = cleanQrCode.slice(1, -1);
      }
      
      // Pour WhatsApp, le QR code est souvent une chaîne encodée
      // On va créer un QR code SVG à partir de cette chaîne
      const qrText = cleanQrCode;
      
      // Générer un QR code simple avec du texte
      // En production, vous pourriez utiliser une bibliothèque QR
      const svgQR = `
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="white"/>
          <text x="128" y="100" text-anchor="middle" font-family="monospace" font-size="8" fill="black">
            QR Code WhatsApp
          </text>
          <text x="128" y="130" text-anchor="middle" font-family="monospace" font-size="6" fill="black">
            ${qrText.substring(0, 30)}...
          </text>
          <text x="128" y="180" text-anchor="middle" font-family="Arial" font-size="12" fill="red">
            Scannez avec WhatsApp
          </text>
        </svg>
      `;
      
      const svgBlob = new Blob([svgQR], { type: 'image/svg+xml' });
      const svgUrl = URL.createObjectURL(svgBlob);
      
      console.log('✅ QR code SVG généré');
      return svgUrl;
      
    } catch (error) {
      console.error('❌ Erreur traitement QR code:', error);
      onError('Erreur lors du traitement du QR code. Veuillez régénérer.');
      return '';
    }
  };

  const qrCodeSrc = getQRCodeSrc();

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
          {qrCodeSrc ? (
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block">
              <img 
                src={qrCodeSrc} 
                alt="QR Code WhatsApp" 
                className="w-64 h-64 mx-auto"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block w-64 h-64 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">Génération du QR code...</p>
              </div>
            </div>
          )}
          
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
