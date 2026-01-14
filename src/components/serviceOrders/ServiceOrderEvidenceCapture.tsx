import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, PenTool, Loader2, Check, X, Image as ImageIcon } from 'lucide-react';
import { PhotoCapture } from '@/components/checklists/PhotoCapture';
import { SignaturePad } from '@/components/checklists/SignaturePad';
import { Badge } from '@/components/ui/badge';
import { ServiceOrderProductsSelector } from './ServiceOrderProductsSelector';
import { useDbServiceOrderProducts, ServiceOrderProductInput } from '@/hooks/useDbServiceOrderProducts';

interface EvidenceItem {
  type: 'photo' | 'signature';
  dataUrl: string;
  latitude?: number;
  longitude?: number;
  capturedAt: Date;
}

interface ServiceOrderEvidenceCaptureProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (evidence: EvidenceItem[], notes: string, usedProducts: ServiceOrderProductInput[]) => void;
  hasChecklist?: boolean;
}

export function ServiceOrderEvidenceCapture({
  open,
  onOpenChange,
  onComplete,
  hasChecklist = false,
}: ServiceOrderEvidenceCaptureProps) {
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [notes, setNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'photos' | 'signature'>('photos');
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usedProducts, setUsedProducts] = useState<ServiceOrderProductInput[]>([]);

  const photos = evidence.filter(e => e.type === 'photo');
  const signature = evidence.find(e => e.type === 'signature');

  const handlePhotoSave = (photoDataUrl: string, metadata: { timestamp: Date; gps?: { latitude: number; longitude: number } }) => {
    setEvidence(prev => [...prev, {
      type: 'photo',
      dataUrl: photoDataUrl,
      latitude: metadata.gps?.latitude,
      longitude: metadata.gps?.longitude,
      capturedAt: metadata.timestamp,
    }]);
    setShowPhotoCapture(false);
  };

  const handleSignatureSave = (signatureDataUrl: string) => {
    // Remove assinatura anterior se existir
    setEvidence(prev => [
      ...prev.filter(e => e.type !== 'signature'),
      {
        type: 'signature',
        dataUrl: signatureDataUrl,
        capturedAt: new Date(),
      }
    ]);
    setShowSignaturePad(false);
  };

  const removePhoto = (index: number) => {
    const photoIndex = evidence.findIndex((e, i) => e.type === 'photo' && photos.indexOf(e) === index);
    setEvidence(prev => prev.filter((_, i) => i !== photoIndex));
  };

  const removeSignature = () => {
    setEvidence(prev => prev.filter(e => e.type !== 'signature'));
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await onComplete(evidence, notes, usedProducts);
      // Reset state
      setEvidence([]);
      setNotes('');
      setActiveTab('photos');
      setUsedProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEvidence([]);
    setNotes('');
    setShowPhotoCapture(false);
    setShowSignaturePad(false);
    onOpenChange(false);
  };

  const hasMinimumEvidence = photos.length >= 1 && signature;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-500" />
            Finalizar Ordem de Serviço
          </DialogTitle>
          <DialogDescription>
            Capture fotos do serviço executado e colete a assinatura do cliente para comprovar a conclusão.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'photos' | 'signature')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="photos" className="gap-2">
              <Camera className="h-4 w-4" />
              Fotos
              {photos.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 justify-center">
                  {photos.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="signature" className="gap-2">
              <PenTool className="h-4 w-4" />
              Assinatura
              {signature && <Check className="h-4 w-4 text-green-500 ml-1" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="photos" className="space-y-4 mt-4">
            {showPhotoCapture ? (
              <PhotoCapture
                onSave={handlePhotoSave}
                onCancel={() => setShowPhotoCapture(false)}
              />
            ) : (
              <>
                {photos.length > 0 && (
                  <div className="grid grid-cols-2 gap-2">
                    {photos.map((photo, index) => (
                      <div key={index} className="relative rounded-lg overflow-hidden border">
                        <img
                          src={photo.dataUrl}
                          alt={`Foto ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <button
                          onClick={() => removePhoto(index)}
                          className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPhotoCapture(true)}
                  className="w-full gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {photos.length > 0 ? 'Adicionar Mais Fotos' : 'Capturar Foto'}
                </Button>

                {photos.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Capture pelo menos uma foto do serviço executado
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="signature" className="space-y-4 mt-4">
            {showSignaturePad ? (
              <SignaturePad
                onSave={handleSignatureSave}
                onCancel={() => setShowSignaturePad(false)}
              />
            ) : (
              <>
                {signature ? (
                  <div className="space-y-2">
                    <div className="relative rounded-lg overflow-hidden border bg-white p-2">
                      <img
                        src={signature.dataUrl}
                        alt="Assinatura do cliente"
                        className="w-full h-32 object-contain"
                      />
                      <button
                        onClick={removeSignature}
                        className="absolute top-2 right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Assinatura capturada em {signature.capturedAt.toLocaleString('pt-BR')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                      <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm text-muted-foreground">
                        Nenhuma assinatura capturada
                      </p>
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowSignaturePad(true)}
                      className="w-full gap-2"
                    >
                      <PenTool className="h-4 w-4" />
                      Coletar Assinatura
                    </Button>
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="space-y-6 mt-4">
          <div>
            <Label>Produtos usados nesta OS</Label>
            <ServiceOrderProductsSelector value={usedProducts} onChange={setUsedProducts} />
          </div>
          <div>
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Adicione observações sobre o serviço executado..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 mt-4">
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleComplete}
            disabled={loading || !hasMinimumEvidence}
            className="gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Check className="h-4 w-4" />
            {hasChecklist ? 'Continuar para Checklist' : 'Finalizar OS'}
          </Button>
        </DialogFooter>

        {!hasMinimumEvidence && (
          <p className="text-xs text-amber-600 text-center">
            Capture pelo menos 1 foto e a assinatura do cliente para finalizar
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
