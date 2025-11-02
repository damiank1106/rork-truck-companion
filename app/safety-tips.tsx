import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";

const INTRO_TITLE =
  "Safety Tip for Semi-Truck Drivers: Guard Space, Control Speed, Stay Predictable";
const CORE_IDEA =
  "Core idea: Most crashes are avoided by managing space and speed and by being predictable to others. Everything below supports those three things.";

type TipBullet = {
  text: string;
  emphasis?: boolean;
};

const SAFETY_TIPS: { title: string; bullets: TipBullet[] }[] = [
  {
    title: "1) Following Distance (Your First Safety System)",
    bullets: [
      { text: "Dry: Keep 7 seconds behind the vehicle ahead." },
      { text: "Rain: Add +2 seconds." },
      { text: "Snow/ice/fog/night/work zones: Add +5 seconds." },
      {
        text:
          "How to measure: Pick a fixed point (sign/overpass). When the vehicle ahead passes it, count “one-thousand-one…” If you reach the point before your target number, back off and rebuild space.",
      },
      {
        text:
          "Why it matters: At highway speeds, a tractor-trailer needs hundreds of feet to stop. Time and space buy you options.",
      },
    ],
  },
  {
    title: "2) Scanning & Mirrors (See Problems Early)",
    bullets: [
      {
        text:
          "Eyes up: Scan 12–15 seconds ahead to spot merging traffic, stale green lights, brake lights, debris, and weather changes.",
      },
      {
        text:
          "Mirrors: Check every 5–8 seconds, and again before and after lane changes, braking, or entering/exiting traffic.",
      },
      {
        text:
          "Blind spots: If you can’t see a car’s headlights in your mirror, assume they’re in a no-go zone and adjust speed/position before turning or changing lanes.",
      },
    ],
  },
  {
    title: "3) Smooth Speed Management (Stability = Safety)",
    bullets: [
      {
        text:
          "Set speed to visibility: If you can’t see far, slow down now—not after you’re surprised.",
      },
      {
        text:
          "Brake early, roll smooth: Ease off throttle as soon as you see a reason to slow. Avoid late, hard brake stabs that upset the trailer.",
      },
      {
        text:
          "Cruise control: Avoid in rain, snow, ice, or heavy traffic. Maintain full control with your right foot.",
      },
    ],
  },
  {
    title: "4) Lane Changes & Merges (Make It Predictable)",
    bullets: [
      {
        text:
          "Plan early: Signal at least 5 seconds before moving.",
      },
      {
        text:
          "Own an “escape lane”: Don’t pace side-by-side. If your escape route closes, drop 2–3 mph to reopen space.",
      },
      {
        text:
          "On-ramps: If safe, create space for merging vehicles by easing off slightly or changing lanes early.",
      },
    ],
  },
  {
    title: "5) Intersections & Turns (Control the Conflict Points)",
    bullets: [
      {
        text:
          "Set up wide turns early: Square the corner and commit only when you can see your trailer clearing the curb and pedestrians/cyclists.",
      },
      {
        text:
          "Stale green lights: If the light has been green a while, assume it may change. Ease off early and be ready to stop without hard braking.",
      },
      {
        text:
          "Railroad crossings: Slow, look, listen, and ensure you can clear completely. Use low gear, no stopping on tracks, and watch low-clearance warnings.",
      },
    ],
  },
  {
    title: "6) Grades & Mountains (Heat Kills Brakes)",
    bullets: [
      { text: "Pick a safe speed before the descent—slower than you think you need." },
      {
        text:
          "Use engine brake first; apply service brakes only in short, firm “snubs” to drop speed a few mph, then release to cool.",
      },
      {
        text:
          "If brakes smell hot or fade: Exit/stop safely and allow a full cool-down. Do not try to “ride it out.”",
      },
    ],
  },
  {
    title: "7) Weather & Visibility (Adjust Early, Not Late)",
    bullets: [
      {
        text:
          "Rain begins = slickest period: Add following distance immediately and reduce speed.",
      },
      { text: "Fog: Low beams only, increase space, be ready to stop short of what you can see." },
      {
        text:
          "Crosswinds: Be extra cautious when empty or lightly loaded. If gusts are strong enough to push you across the lane or signage reports high winds, reduce speed significantly or park until conditions improve.",
      },
      {
        text:
          "Snow/ice: Gentle throttle/brake/steering inputs. If you feel the trailer step out, straighten the tractor and ease off gently—no sudden corrections.",
      },
    ],
  },
  {
    title: "8) Stopping in Traffic (Protect the Front of Your Truck)",
    bullets: [
      {
        text:
          "Leave a “steer-out” gap: At stops, keep enough space to see the vehicle’s rear tires touching the pavement. If the vehicle behind fails to stop, you can steer out.",
      },
      {
        text:
          "Watch mirrors: Monitor closing traffic behind you; tap brake lights earlier to alert them.",
      },
    ],
  },
  {
    title: "9) Backing (Most Preventable Incidents)",
    bullets: [
      {
        text:
          "GOAL—Get Out And Look. Every time the picture isn’t perfect, stop and check.",
      },
      {
        text:
          "Use a spotter if available, agree on clear hand signals, and stop if you lose sight of them.",
      },
      {
        text:
          "Take your time: Straighten the trailer before turning; small corrections beat big ones.",
      },
    ],
  },
  {
    title: "10) Fatigue, Distraction & Impairment (Zero Tolerance)",
    bullets: [
      {
        text:
          "Fatigue: If your head nods or you miss a sign, you’re already too tired. Park and rest.",
      },
      {
        text:
          "Phones: No hand-held use while moving. If dispatch or navigation needs attention, pull over safely.",
      },
      {
        text:
          "Medications/substances: Know how they affect alertness. If you’re not 100%, don’t roll.",
      },
    ],
  },
  {
    title: "11) Vehicle Condition (Your Equipment Must Be Ready)",
    bullets: [
      {
        text:
          "Pre-trip, en-route, post-trip inspections: Brakes, tires, lights, coupling, airlines, leaks, and load securement every time.",
      },
      {
        text:
          "Tires: Maintain manufacturer-recommended pressures. Replace when tread is low (commonly 4/32\" steer, 2/32\" drive/trailer minimums).",
      },
      {
        text:
          "Brakes: If you notice pulling, fade, or a soft pedal, address it immediately—don’t “watch and wait.”",
      },
    ],
  },
  {
    title: "12) Load Securement (Stable Loads Drive Safely)",
    bullets: [
      {
        text:
          "Check at start, again at 50 miles, then every 150 miles/3 hours or at duty status change.",
        emphasis: true,
      },
      {
        text:
          "Even light loads need securement. Shifting cargo changes handling and braking.",
      },
    ],
  },
  {
    title: "13) Communication (Let Others Know Your Plan)",
    bullets: [
      { text: "Signal early and clearly." },
      { text: "Headlights on in rain/low light." },
      {
        text:
          "Use four-ways when approaching a stop on high-speed roads or when crawling significantly below traffic speed.",
      },
    ],
  },
  {
    title: "14) Breakdowns & Emergencies (Control the Scene)",
    bullets: [
      {
        text:
          "Get off the roadway if possible; if not, move as far right as you safely can, angle wheels away from traffic.",
      },
      {
        text:
          "Triangles/flares: Place per DOT guidance so approaching drivers have time to react (on two-way roads: one in front and two behind; on divided highways: all three behind, spaced to warn early).",
      },
      {
        text:
          "Stay visible: High-visibility vest, lights on, hood up if safe to signal distress.",
      },
      {
        text:
          "If a collision occurs: Protect people first, call for help, secure the scene, photograph, and document—no roadside arguments.",
      },
    ],
  },
];

const MICRO_HABITS = [
  "Rebuild a 7-second gap anytime it shrinks.",
  "Mirrors every 5–8 seconds—always know who’s on your flanks.",
  "Ease off throttle the moment visibility shrinks or hazards appear.",
  "Keep an escape lane; don’t pace next to others.",
  "Signal early, then make only one smooth move.",
  "Hydrate, eat light, and rest—alert drivers make smooth decisions.",
  "Recheck load and tires at the first stop and routinely thereafter.",
];

const BOTTOM_LINE =
  "Protect space, control speed, and stay predictable. Do those three things consistently, and you dramatically cut your risk—no matter what the road throws at you.";

export default function SafetyTipsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerLeft = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => router.replace("/(tabs)/home")}
      accessibilityLabel="Go back"
    >
      <ArrowLeft color={Colors.black} size={22} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Safety Tips"
        topInset={insets.top + 16}
        leftAccessory={headerLeft}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.introTitle}>{INTRO_TITLE}</Text>
          <Text style={styles.paragraph}>{CORE_IDEA}</Text>
        </View>
        {SAFETY_TIPS.map((tip) => (
          <View key={tip.title} style={styles.section}>
            <Text style={styles.tipTitle}>{tip.title}</Text>
            {tip.bullets.map((bullet) => (
              <Text key={bullet.text} style={styles.bullet}>
                <Text style={styles.bulletIcon}>• </Text>
                {bullet.emphasis ? (
                  <Text style={styles.tipEmphasis}>{bullet.text}</Text>
                ) : (
                  bullet.text
                )}
              </Text>
            ))}
          </View>
        ))}
        <View style={styles.section}>
          <Text style={styles.tipTitle}>Daily “Micro-Habits” That Prevent Big Problems</Text>
          {MICRO_HABITS.map((habit) => (
            <Text key={habit} style={styles.bullet}>
              <Text style={styles.bulletIcon}>• </Text>
              {habit}
            </Text>
          ))}
        </View>
        <View style={styles.section}>
          <Text style={styles.tipTitle}>Bottom line</Text>
          <Text style={styles.paragraph}>{BOTTOM_LINE}</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  section: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.black,
    opacity: 0.85,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: Colors.black,
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.black,
    marginBottom: 8,
  },
  bulletIcon: {
    color: Colors.primaryLight,
    fontWeight: "700" as const,
  },
  tipEmphasis: {
    fontWeight: "700" as const,
    color: Colors.black,
  },
});
