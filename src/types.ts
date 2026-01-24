export interface AthleteData {
    Name: string;
    PhysicalState: number; // 1-5
    AnxietyLevel: number; // 1-5
    PerformanceRating: number; // 1-10
    ReactionToMistakes: string; // "Shook it off" | "Got Angry" | "Got Scared/Conservative"
    TacticalCompliance: string; // "Yes" | "No" (Handling loose string input)
    MindsetThreeWords: string;
    BestMomentStruggle: string;
}

export type TrafficLightStatus = "🟢" | "🟡" | "🔴";

export interface AnalysisResult {
    athlete: AthleteData;
    status: TrafficLightStatus;
    redFlags: string[];
    rootCause?: string; // Cause of the primary red flag
    suggestedAction?: string; // Intervention
}

export interface RosterTableRow {
    name: string;
    status: TrafficLightStatus;
    anxietyLabel: string; // "High (5)"
    focusLabel: string;   // "Low"
    action: string;       // "Reset Ritual"
    badge: string;        // "[ CRITICAL ]"
}

export interface CoachingReportData {
    date: string;
    overallStatus: string;
    executiveSummary: string;
    redFlagsList: { name: string; problem: string; rootCause: string; action: string }[];
    teamMetrics: {
        physicalReadiness: number;
        mentalResilience: number;
        tacticalDiscipline: number;
    };
    playerBreakdown: { name: string; status: TrafficLightStatus }[]; // Deprecated but kept for compatibility if needed
    rosterTable: RosterTableRow[]; // New field for Visual Standards
    actionPlan: string;
}
