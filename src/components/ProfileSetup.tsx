
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Bot, Globe, Briefcase, Clock, Euro, Webhook } from 'lucide-react';
import type { ClientProfile } from '@/types/norbert';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const [profile, setProfile] = useState<Partial<ClientProfile>>({
    bio_description: '',
    website_url: '',
    services_offered: '',
    availability: '',
    pricing: '',
    ai_instructions_built: '',
    n8n_webhook_url: ''
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    
    // Simulation de la sauvegarde et génération du prompt IA
    setTimeout(() => {
      // Ici on construirait le prompt IA basé sur les informations
      const aiInstructions = `
Tu es Norbert, l'assistant IA de ${profile.bio_description || 'cet artisan'}.

Informations sur l'entreprise :
- Services : ${profile.services_offered}
- Disponibilités : ${profile.availability}
- Tarifs : ${profile.pricing}
- Site web : ${profile.website_url || 'Non renseigné'}
- Webhook N8N : ${profile.n8n_webhook_url || 'Non configuré'}

Ton rôle :
1. Répondre aux demandes clients de manière professionnelle et chaleureuse
2. Qualifier les demandes (urgent/normal)
3. Proposer des créneaux de rendez-vous
4. Donner des informations sur les services et tarifs
5. Rediriger vers le propriétaire si nécessaire
6. Déclencher des workflows N8N quand nécessaire

Sois toujours poli, professionnel et utile.
      `.trim();

      console.log('Instructions IA générées:', aiInstructions);
      console.log('Webhook N8N configuré:', profile.n8n_webhook_url);
      setIsLoading(false);
      onComplete();
    }, 2000);
  };

  const updateProfile = (field: keyof ClientProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = profile.bio_description && profile.services_offered && profile.availability;

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="bg-header-bg p-3 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Bot className="h-8 w-8 text-header-text" />
          </div>
          <h1 className="text-2xl font-bold text-main mb-2">
            Configurez votre IA
          </h1>
          <p className="text-main opacity-70">
            Ces informations permettront à Norbert de répondre comme vous
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg text-main">
                <Briefcase className="h-5 w-5" />
                <span>Votre activité</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="bio" className="text-main">Description de votre métier *</Label>
                <Textarea
                  id="bio"
                  placeholder="Ex: Je suis plombier avec 15 ans d'expérience, spécialisé dans les rénovations de salle de bain..."
                  value={profile.bio_description}
                  onChange={(e) => updateProfile('bio_description', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="website" className="text-main">Site web (optionnel)</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Globe className="h-4 w-4 text-main opacity-70" />
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://monsite.fr"
                    value={profile.website_url}
                    onChange={(e) => updateProfile('website_url', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-main">Services proposés *</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Installation sanitaire, réparation fuite, rénovation salle de bain, dépannage urgence..."
                value={profile.services_offered}
                onChange={(e) => updateProfile('services_offered', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg text-main">
                <Clock className="h-5 w-5" />
                <span>Disponibilités *</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Lundi-Vendredi 8h-18h, Samedi 9h-17h. Interventions d'urgence possible 24h/24..."
                value={profile.availability}
                onChange={(e) => updateProfile('availability', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg text-main">
                <Euro className="h-5 w-5" />
                <span>Tarifs (optionnel)</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Ex: Déplacement 50€, taux horaire 65€, devis gratuit. Supplément urgence weekend +30%..."
                value={profile.pricing}
                onChange={(e) => updateProfile('pricing', e.target.value)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-lg text-main">
                <Webhook className="h-5 w-5" />
                <span>Configuration N8N</span>
              </CardTitle>
              <CardDescription className="text-main opacity-70">
                URL du webhook N8N pour automatiser vos workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="n8n-webhook" className="text-main">URL du webhook N8N (optionnel)</Label>
                <Input
                  id="n8n-webhook"
                  type="url"
                  placeholder="https://votre-n8n.com/webhook/norbert"
                  value={profile.n8n_webhook_url}
                  onChange={(e) => updateProfile('n8n_webhook_url', e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-main opacity-60 mt-1">
                  Cette URL sera utilisée pour déclencher des actions automatiques (notifications, CRM, etc.)
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 space-y-4">
          <Button 
            onClick={handleSubmit} 
            className="w-full bg-cta hover:bg-cta/90"
            disabled={!isFormValid || isLoading}
          >
            {isLoading ? 'Configuration en cours...' : 'Finaliser la configuration'}
          </Button>
          
          {!isFormValid && (
            <p className="text-sm text-main opacity-70 text-center">
              Veuillez remplir les champs obligatoires (*)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
