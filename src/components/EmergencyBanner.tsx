import { AlertCircle, Phone, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const EmergencyBanner = () => {
  return (
    <Alert className="border-2 border-destructive bg-destructive/20 shadow-lg animate-in fade-in slide-in-from-bottom-4">
      <AlertCircle className="h-6 w-6 text-destructive animate-pulse" />
      <AlertTitle className="text-destructive font-semibold">We're here to help</AlertTitle>
      <AlertDescription className="text-sm mt-2 space-y-3">
        <p className="text-foreground">
          If you're having thoughts of self-harm or suicide, please reach out for support. You're not alone.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            variant="destructive"
            size="sm"
            className="gap-2"
            asChild
          >
            <a href="tel:988" className="flex items-center">
              <Phone className="h-4 w-4" />
              Call 988 (US Crisis Line)
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            asChild
          >
            <a
              href="https://988lifeline.org"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4" />
              More Resources
            </a>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
          <p><strong>International:</strong></p>
          <p>🌍 <a href="https://findahelpline.com" target="_blank" rel="noopener noreferrer" className="underline">Find a Helpline</a> - Global directory</p>
          <p>🇬🇧 UK: 116 123 (Samaritans)</p>
          <p>🇨🇦 Canada: 1-833-456-4566</p>
          <p>🇦🇺 Australia: 13 11 14 (Lifeline)</p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default EmergencyBanner;
