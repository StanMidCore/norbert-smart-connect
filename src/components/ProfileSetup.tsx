
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building2, MessageSquare, Zap, Globe, Clock, Euro, ArrowRight } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const [formData, setFormData] = useState({
    name: 'Stan Normand',
    company: 'Stokn',
    position: 'CEO',
    activity: '',
    website: '',
    services: '',
    availability: '',
    pricing: '',
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendToN8N = async (profileData: any) => {
    try {
      const webhookUrl = 'https://norbert.n8n.cloud/webhook/norbert-profile-setup';
      
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: formData.name,
          company: formData.company,
          activity: profileData.activity,
          services: profileData.services,
          availability: profileData.availability,
          pricing: profileData.pricing,
          website: profileData.website,
          timestamp: new Date().toISOString(),
        }),
      });
      
      console.log('Données envoyées vers N8N');
    } catch (error) {
      console.error('Erreur envoi N8N:', error);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Simuler une sauvegarde locale
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Envoyer vers N8N
      await sendToN8N(formData);
      
      toast({
        title: "Profil configuré",
        description: "Votre profil IA a été sauvegardé avec succès",
      });
      
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la sauvegarde du profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoToDashboard = () => {
    onComplete();
  };

  return (
    <div className="min-h-screen bg-app-bg p-4 pt-safe-offset-16 sm:pt-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-header rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-main">Configurez votre IA</h1>
          <p className="text-main opacity-70 mt-2">
            Ces informations permettront à Norbert de répondre comme vous
          </p>
        </div>

        {/* Votre activité */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-main">
              <Building2 className="h-5 w-5" />
              Votre activité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="activity" className="text-main">Description de votre métier *</Label>
              <Textarea
                id="activity"
                value={formData.activity}
                onChange={(e) => handleInputChange('activity', e.target.value)}
                className="border-gray-200 min-h-20"
                placeholder="Ex: Je suis plombier avec 15 ans d'expérience, spécialisé dans les rénovations de salle de bain..."
              />
            </div>
            
            <div>
              <Label htmlFor="website" className="text-main">Site web (optionnel)</Label>
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="border-gray-200"
                  placeholder="https://monsite.fr"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services proposés */}
        <Card>
          <CardContent className="p-4">
            <div>
              <Label htmlFor="services" className="text-main font-medium">Services proposés *</Label>
              <Textarea
                id="services"
                value={formData.services}
                onChange={(e) => handleInputChange('services', e.target.value)}
                className="border-gray-200 min-h-20 mt-2"
                placeholder="Ex: Installation sanitaire, réparation fuite, rénovation salle de bain, dépannage urgence..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Disponibilités */}
        <Card>
          <CardContent className="p-4">
            <div>
              <Label htmlFor="availability" className="text-main font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Disponibilités *
              </Label>
              <Textarea
                id="availability"
                value={formData.availability}
                onChange={(e) => handleInputChange('availability', e.target.value)}
                className="border-gray-200 min-h-20 mt-2"
                placeholder="Ex: Lundi-Vendredi 8h-18h, Samedi 9h-17h. Interventions d'urgence possible 24h/24..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Tarifs */}
        <Card>
          <CardContent className="p-4">
            <div>
              <Label htmlFor="pricing" className="text-main font-medium flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Tarifs (optionnel)
              </Label>
              <Textarea
                id="pricing"
                value={formData.pricing}
                onChange={(e) => handleInputChange('pricing', e.target.value)}
                className="border-gray-200 min-h-20 mt-2"
                placeholder="Ex: Déplacement 50€, taux horaire 65€, devis gratuit. Supplément urgence weekend +30%..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Cards */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="h-8 w-8 text-blue-600" />
                  <div>
                    <h3 className="font-medium text-main">Canaux connectés</h3>
                    <p className="text-sm text-main opacity-70">Vos comptes sont prêts</p>
                  </div>
                </div>
                <Badge className="bg-status-success text-white">
                  Configuré
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Zap className="h-8 w-8 text-purple-600" />
                  <div>
                    <h3 className="font-medium text-main">IA Norbert</h3>
                    <p className="text-sm text-main opacity-70">Assistant intelligent activé</p>
                  </div>
                </div>
                <Badge className="bg-status-success text-white">
                  Actif
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pb-safe-offset-6">
          <Button 
            onClick={handleComplete}
            disabled={loading}
            className="w-full py-6 text-lg text-white"
            style={{ backgroundColor: 'var(--header-background)' }}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sauvegarde en cours...
              </>
            ) : (
              'Sauvegarder le profil'
            )}
          </Button>

          <Button 
            onClick={handleGoToDashboard}
            className="w-full py-6 text-lg text-white"
            style={{ backgroundColor: 'var(--cta-button)' }}
          >
            Accéder au Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
