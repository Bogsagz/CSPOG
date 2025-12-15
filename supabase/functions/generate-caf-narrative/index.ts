import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AssessmentDataItem {
  questionText: string;
  response: boolean | null;
  isNegativeIndicator: boolean;
  evidence: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { projectId, outcomeId, outcomeName, outcomeDescription, assessmentData } = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for failed negative indicators
    const failedNegativeIndicators = (assessmentData as AssessmentDataItem[])
      .filter(data => data.isNegativeIndicator && data.response === true)
      .map(data => data.questionText);
    
    const hasFailed = failedNegativeIndicators.length > 0;
    
    console.log(`Generating narrative for ${outcomeId}. Failed: ${hasFailed}. Failed indicators:`, failedNegativeIndicators);

    // Prepare data for AI
    const assessmentSummary = (assessmentData as AssessmentDataItem[])
      .map((data) => {
        const answer = data.response === null ? "Not answered" : data.response ? "Yes" : "No";
        const evidenceList = data.evidence.length > 0 ? data.evidence.join(", ") : "No supporting evidence";
        
        // Interpret compliance based on whether it's a negative indicator
        let complianceStatus = "";
        if (data.response !== null) {
          if (data.isNegativeIndicator) {
            // For negative indicators: No = compliant, Yes = non-compliant
            complianceStatus = data.response ? " (FAILED - Non-compliant - issue present)" : " (Compliant - issue not present)";
          } else {
            // For positive indicators: Yes = compliant, No = non-compliant
            complianceStatus = data.response ? " (Compliant - requirement met)" : " (Non-compliant - requirement not met)";
          }
        }
        
        return `${data.isNegativeIndicator ? "[NEGATIVE INDICATOR]" : "[POSITIVE INDICATOR]"} Question: ${data.questionText}\nAnswer: ${answer}${complianceStatus}\nSupporting Evidence: ${evidenceList}`;
      })
      .join("\n\n");

    // Call Lovable AI to generate narrative
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are writing a compliance assessment summary for the NCSC Cyber Assessment Framework (CAF).

**ABSOLUTE PRIORITY RULE:**
If ANY question marked "[NEGATIVE INDICATOR]" shows "FAILED - Non-compliant - issue present", the ENTIRE outcome has FAILED compliance. You MUST start your paragraph with this failure.

**STRUCTURE FOR FAILED OUTCOMES (when negative indicator shows FAILED):**
1. FIRST SENTENCE: State explicitly that the outcome has failed compliance
2. SECOND SENTENCE: Name the specific negative indicator question that caused the failure
3. Explain the implication of this failure
4. Then transition to discuss any compliant aspects (positive indicators that were met)
5. Keep the overall tone balanced but clear about the failure

**STRUCTURE FOR COMPLIANT OUTCOMES (no negative indicators failed):**
- Lead with compliance achievement
- Reference the positive indicators that were met
- Include supporting evidence

**STYLE REQUIREMENTS:**
- 80-120 words maximum
- Direct, active voice
- Professional but conversational
- No hedging or unnecessary qualifiers
- Every sentence adds value
- Failures ALWAYS come first when present`;

    const userPrompt = `Generate a compliance narrative for the following CAF outcome:

Outcome ID: ${outcomeId}
Outcome Name: ${outcomeName}
Outcome Description: ${outcomeDescription}
${hasFailed ? `\n⚠️ CRITICAL: This outcome HAS FAILED due to negative indicator(s). You MUST state the failure first.\nFailed Negative Indicators: ${failedNegativeIndicators.join("; ")}\n` : ""}

Assessment Responses:
${assessmentSummary}

${hasFailed ? "This outcome has FAILED compliance. Start your paragraph by stating this failure and naming the failed negative indicator." : "Write a formal paragraph describing the compliance status of this outcome based on the assessment data provided."}`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required. Please add credits to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const narrative = aiData.choices?.[0]?.message?.content;

    if (!narrative) {
      throw new Error("No narrative generated");
    }

    // Store the narrative in the database
    const { error: upsertError } = await supabase
      .from("caf_outcome_narratives")
      .upsert(
        {
          project_id: projectId,
          outcome_id: outcomeId,
          narrative,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "project_id,outcome_id" }
      );

    if (upsertError) throw upsertError;

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating narrative:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
