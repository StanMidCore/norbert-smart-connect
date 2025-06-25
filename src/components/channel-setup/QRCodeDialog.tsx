
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QrCode, Loader2, RefreshCw } from 'lucide-react';
// import QRCode from 'qrcode'; // Temporairement commenté pour éviter l'erreur de build

interface QRCodeDialogProps {
  qrCode: string | null;
  connecting: string | null;
  onClose: () => void;
  onRegenerate: () => void;
  onError: (message: string) => void;
}

const QRCodeDialog = ({ qrCode, connecting, onClose, onRegenerate, onError }: QRCodeDialogProps) => {
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');
  const [isGenerating, setIsGenerating] = React.useState(false);

  React.useEffect(() => {
    if (qrCode) {
      generateQRCode(qrCode);
    }
  }, [qrCode]);

  const generateQRCode = async (data: string) => {
    setIsGenerating(true);
    try {
      console.log('🔍 Génération QR code pour WhatsApp, longueur:', data.length);
      
      // Nettoyer les données du QR code
      let cleanData = data.trim();
      if (cleanData.startsWith('"') && cleanData.endsWith('"')) {
        cleanData = cleanData.slice(1, -1);
      }
      
      // TODO: Générer le QR code avec une bibliothèque compatible
      // Temporairement, on simule la génération
      setTimeout(() => {
        setQrCodeDataUrl(''); // Pas de QR code pour le moment
        console.log('⚠️ QR code temporairement désactivé');
        setIsGenerating(false);
      }, 1000);
      
    } catch (error) {
      console.error('❌ Erreur génération QR code:', error);
      onError('Impossible de générer le QR code. Veuillez régénérer.');
      setIsGenerating(false);
    }
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
          {!isGenerating ? (
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block w-64 h-64 flex items-center justify-center">
              <div className="text-center">
                <QrCode className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <p className="text-sm text-gray-600">
                  QR Code temporairement indisponible
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Fonctionnalité en cours de configuration
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-gray-100 p-4 rounded-lg border-2 border-gray-200 mx-auto inline-block w-64 h-64 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Génération du QR code...
                </p>
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
            <p className="text-xs text-orange-600 font-medium">
              ⚠️ QR code temporairement indisponible - fonctionnalité en développement
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
