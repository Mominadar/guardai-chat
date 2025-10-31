import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Save, Trash2 } from "lucide-react";

const GuardianSettings = () => {
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasGuardian, setHasGuardian] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchGuardianData();
  }, []);

  const fetchGuardianData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("guardian_emails")
        .select("guardian_email, guardian_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGuardianEmail(data.guardian_email);
        setGuardianName(data.guardian_name || "");
        setHasGuardian(true);
      }
    } catch (error: any) {
      console.error("Error fetching guardian data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    if (!guardianEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter a guardian email address.",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(guardianEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const guardianData = {
        user_id: user.id,
        guardian_email: guardianEmail.trim(),
        guardian_name: guardianName.trim() || null,
      };

      if (hasGuardian) {
        const { error } = await supabase
          .from("guardian_emails")
          .update(guardianData)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("guardian_emails")
          .insert(guardianData);

        if (error) throw error;
        setHasGuardian(true);
      }

      toast({
        title: "Success",
        description: "Guardian contact saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving guardian:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save guardian contact.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("guardian_emails")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      setGuardianEmail("");
      setGuardianName("");
      setHasGuardian(false);

      toast({
        title: "Success",
        description: "Guardian contact removed successfully.",
      });
    } catch (error: any) {
      console.error("Error deleting guardian:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove guardian contact.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <CardTitle>Guardian Contact</CardTitle>
        </div>
        <CardDescription>
          Add a trusted person who will be notified if concerning messages are detected.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="guardian-name">Guardian Name (Optional)</Label>
          <Input
            id="guardian-name"
            type="text"
            placeholder="John Doe"
            value={guardianName}
            onChange={(e) => setGuardianName(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="guardian-email">Guardian Email *</Label>
          <Input
            id="guardian-email"
            type="email"
            placeholder="guardian@example.com"
            value={guardianEmail}
            onChange={(e) => setGuardianEmail(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Guardian
          </Button>
          {hasGuardian && (
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              variant="destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default GuardianSettings;
