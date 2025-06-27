
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useNorbertUser } from '@/hooks/useNorbertUser';
import { Loader2, User, Building2, MessageSquare, Zap, Globe, Clock, Euro, ArrowRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
  const { user } = useNorbertUser();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const sendToPersonalizedWebhook = async (profileData: any) => {
    if (!user?.email) {
      console.error('❌ Email utilisateur manquant pour webhook personnalisé');
      return;
    }

    try {
      // Générer l'URL du webhook personnalisé basé sur l'email
      const webhookPath = `${user.email.replace(/[^a-zA-Z0-9]/g, '-')}-webhook`;
      const webhookUrl = `https://n8n.srv784558.hstgr.cloud/webhook/${webhookPath}`;
      
      console.log(`🎯 Envoi vers webhook personnalisé: ${webhookUrl}`);
      
      const payload = {
        type: 'profile_setup',
        user_email: user.email,
        user_name: formData.name,
        company: formData.company,
        position: formData.position,
        activity: profileData.activity,
        services: profileData.services,
        availability: profileData.availability,
        pricing: profileData.pricing,
        website: profileData.website,
        timestamp: new Date().toISOString(),
        source: 'norbert_profile_setup'
      };
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        console.log('✅ Données envoyées vers webhook personnalisé');
      } else {
        console.error('❌ Erreur webhook personnalisé:', response.status);
      }
    } catch (error) {
      console.error('❌ Erreur envoi webhook personnalisé:', error);
    }
  };

  const saveToSupabase = async (profileData: any) => {
    if (!user?.id) {
      console.error('❌ User ID manquant pour sauvegarde Supabase');
      return;
    }

    try {
      console.log('💾 Sauvegarde profil client dans Supabase...');
      
      const { data, error } = await supabase
        .from('client_profiles')
        .upsert({
          user_id: user.id,
          bio_description: profileData.activity,
          services_offered: profileData.services,
          availability: profileData.availability,
          pricing: profileData.pricing,
          website_url: profileData.website,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('❌ Erreur sauvegarde Supabase:', error);
      } else {
        console.log('✅ Profil sauvegardé dans Supabase');
      }
    } catch (error) {
      console.error('❌ Erreur Supabase:', error);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // 1. Sauvegarder dans Supabase
      await saveToSupabase(formData);
      
      // 2. Envoyer vers le webhook personnalisé du client
      await sendToPersonalizedWebhook(formData);
      
      toast({
        title: "Profil configuré",
        description: `Votre IA personnalisée a été configurée avec succès`,
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
          {user?.email && (
            <p className="text-sm text-blue-600 mt-1">
              IA personnalisée pour: {user.email}
            </p>
          )}
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
                    <h3 className="font-medium text-main">IA Norbert Personnalisée</h3>
                    <p className="text-sm text-main opacity-70">Assistant intelligent activé pour vous</p>
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
            className="w-full py-6 text-lg bg-header text-white hover:bg-header/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Configuration en cours...
              </>
            ) : (
              'Configurer mon IA personnalisée'
            )}
          </Button>

          <Button 
            onClick={handleGoToDashboard}
            className="w-full py-6 text-lg bg-cta text-white hover:bg-cta/90"
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
