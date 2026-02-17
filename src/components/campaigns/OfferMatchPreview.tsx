"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Loader2 } from "lucide-react";

interface OfferMatchPreviewProps {
  campaignId: string;
}

interface MatchEntry {
  offerId: string;
  merchantName: string;
  offerTitle: string;
  discountText: string;
  contactCount: number;
  avgDistance: number;
}

export function OfferMatchPreview({ campaignId }: OfferMatchPreviewProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["offer-matches", campaignId],
    queryFn: async () => {
      const res = await fetch(`/api/agent/offer-matches?campaign_id=${campaignId}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const matches: MatchEntry[] = data?.matches || [];
  const totalContacts = data?.totalContacts || 0;

  if (matches.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        No offer matches available. Make sure your contacts have verified addresses.
      </p>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-orange-500" />
          Offer Matching Preview
        </CardTitle>
        <CardDescription>
          {totalContacts} contacts matched to {matches.length} offer{matches.length !== 1 ? "s" : ""} by proximity
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {matches.map((match) => (
            <div
              key={match.offerId}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{match.merchantName}</p>
                <p className="text-xs text-muted-foreground truncate">{match.offerTitle}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
                  {match.discountText}
                </Badge>
                <div className="text-right">
                  <p className="text-sm font-medium">{match.contactCount}</p>
                  <p className="text-[10px] text-muted-foreground">contacts</p>
                </div>
                {match.avgDistance > 0 && (
                  <div className="text-right">
                    <p className="text-sm font-medium">{match.avgDistance}</p>
                    <p className="text-[10px] text-muted-foreground">mi avg</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
