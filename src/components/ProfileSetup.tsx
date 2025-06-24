
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Building2, MessageSquare, Zap } from 'lucide-react';

interface ProfileSetupProps {
  onComplete: () => void;
}

const ProfileSetup = ({ onComplete }: ProfileSetupProps) => {
  const [formData, setFormData] = useState({
    name: 'Stan Normand',
    company: 'Stokn',
    position: 'CEO',
    description: 'Expert en marketing digital et automatisation commerciale',
  });
  
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleComplete = async () => {
    setLoading(true);
    
    // Simuler une sauvegarde
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Profil configuré",
      description: "Votre profil a été sauvegardé avec succès",
    });
    
    setLoading(false);
    onComplete();
  };

  return (
    <div className="min-h-screen bg-app-bg p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-16 h-16 bg-main rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-main">Configuration du profil</h1>
          <p className="text-main opacity-70 mt-2">
            Personnalisez votre profil pour l'IA Norbert
          </p>
        </div>

        {/* Profil Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-main">
              <User className="h-5 w-5" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-main">Nom complet</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="border-gray-200"
              />
            </div>
            
            <div>
              <Label htmlFor="company" className="text-main">Entreprise</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                className="border-gray-200"
              />
            </div>
            
            <div>
              <Label htmlFor="position" className="text-main">Poste</Label>
              <Input
                id="position"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="border-gray-200"
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="text-main">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className="border-gray-200 min-h-20"
                placeholder="Décrivez votre activité et vos domaines d'expertise..."
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

        {/* Action Button */}
        <Button 
          onClick={handleComplete}
          disabled={loading}
          className="w-full bg-main hover:bg-main/90 text-white py-6 text-lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Configuration en cours...
            </>
          ) : (
            'Finaliser la configuration'
          )}
        </Button>
      </div>
    </div>
  );
};

export default ProfileSetup;
