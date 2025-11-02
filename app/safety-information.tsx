import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";

import PageHeader from "@/components/PageHeader";
import Colors from "@/constants/colors";

export default function SafetyInformationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const headerLeft = (
    <TouchableOpacity
      style={styles.headerButton}
      onPress={() => router.replace("/(tabs)/home")}
      accessibilityRole="button"
      accessibilityLabel="Go back to home"
    >
      <ArrowLeft color={Colors.text} size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <PageHeader
        title="Safety Information"
        topInset={insets.top + 12}
        leftAccessory={headerLeft}
      />

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 32) }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.introTitle}>
            Safety Tip for Semi-Truck Drivers: Guard Space, Control Speed, Stay Predictable
          </Text>
          <Text style={styles.introText}>
            Most crashes are avoided by managing space and speed and by being predictable to others. Everything
            below supports those three things.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1) Following Distance (Your First Safety System)</Text>
            <Text style={styles.sectionParagraph}>Dry: Keep 7 seconds behind the vehicle ahead.</Text>
            <Text style={styles.sectionParagraph}>Rain: Add +2 seconds.</Text>
            <Text style={styles.sectionParagraph}>Snow/ice/fog/night/work zones: Add +5 seconds.</Text>
            <Text style={styles.sectionParagraph}>
              How to measure: Pick a fixed point (sign/overpass). When the vehicle ahead passes it, count
              “one-thousand-one…” If you reach the point before your target number, back off and rebuild space.
            </Text>
            <Text style={styles.sectionParagraph}>
              Why it matters: At highway speeds, a tractor-trailer needs hundreds of feet to stop. Time and space buy
              you options.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2) Scanning &amp; Mirrors (See Problems Early)</Text>
            <Text style={styles.sectionParagraph}>
              Eyes up: Scan 12–15 seconds ahead to spot merging traffic, stale green lights, brake lights, debris, and
              weather changes.
            </Text>
            <Text style={styles.sectionParagraph}>
              Mirrors: Check every 5–8 seconds, and again before and after lane changes, braking, or entering/exiting
              traffic.
            </Text>
            <Text style={styles.sectionParagraph}>
              Blind spots: If you can’t see a car’s headlights in your mirror, assume they’re in a no-go zone and
              adjust speed/position before turning or changing lanes.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3) Smooth Speed Management (Stability = Safety)</Text>
            <Text style={styles.sectionParagraph}>
              Set speed to visibility: If you can’t see far, slow down now—not after you’re surprised.
            </Text>
            <Text style={styles.sectionParagraph}>
              Brake early, roll smooth: Ease off throttle as soon as you see a reason to slow. Avoid late, hard brake
              stabs that upset the trailer.
            </Text>
            <Text style={styles.sectionParagraph}>
              Cruise control: Avoid in rain, snow, ice, or heavy traffic. Maintain full control with your right foot.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>4) Lane Changes &amp; Merges (Make It Predictable)</Text>
            <Text style={styles.sectionParagraph}>Plan early: Signal at least 5 seconds before moving.</Text>
            <Text style={styles.sectionParagraph}>
              Own an “escape lane”: Don’t pace side-by-side. If your escape route closes, drop 2–3 mph to reopen space.
            </Text>
            <Text style={styles.sectionParagraph}>
              On-ramps: If safe, create space for merging vehicles by easing off slightly or changing lanes early.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5) Intersections &amp; Turns (Control the Conflict Points)</Text>
            <Text style={styles.sectionParagraph}>
              Set up wide turns early: Square the corner and commit only when you can see your trailer clearing the curb
              and pedestrians/cyclists.
            </Text>
            <Text style={styles.sectionParagraph}>
              Stale green lights: If the light has been green a while, assume it may change. Ease off early and be ready
              to stop without hard braking.
            </Text>
            <Text style={styles.sectionParagraph}>
              Railroad crossings: Slow, look, listen, and ensure you can clear completely. Use low gear, no stopping on
              tracks, and watch low-clearance warnings.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6) Grades &amp; Mountains (Heat Kills Brakes)</Text>
            <Text style={styles.sectionParagraph}>
              Pick a safe speed before the descent—slower than you think you need.
            </Text>
            <Text style={styles.sectionParagraph}>
              Use engine brake first; apply service brakes only in short, firm “snubs” to drop speed a few mph, then
              release to cool.
            </Text>
            <Text style={styles.sectionParagraph}>
              If brakes smell hot or fade: Exit/stop safely and allow a full cool-down. Do not try to “ride it out.”
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>7) Weather &amp; Visibility (Adjust Early, Not Late)</Text>
            <Text style={styles.sectionParagraph}>
              Rain begins = slickest period: Add following distance immediately and reduce speed.
            </Text>
            <Text style={styles.sectionParagraph}>
              Fog: Low beams only, increase space, be ready to stop short of what you can see.
            </Text>
            <Text style={styles.sectionParagraph}>
              Crosswinds: Be extra cautious when empty or lightly loaded. If gusts are strong enough to push you across
              the lane or signage reports high winds, reduce speed significantly or park until conditions improve.
            </Text>
            <Text style={styles.sectionParagraph}>
              Snow/ice: Gentle throttle/brake/steering inputs. If you feel the trailer step out, straighten the tractor
              and ease off gently—no sudden corrections.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>8) Stopping in Traffic (Protect the Front of Your Truck)</Text>
            <Text style={styles.sectionParagraph}>
              Leave a “steer-out” gap: At stops, keep enough space to see the vehicle’s rear tires touching the
              pavement. If the vehicle behind fails to stop, you can steer out.
            </Text>
            <Text style={styles.sectionParagraph}>
              Watch mirrors: Monitor closing traffic behind you; tap brake lights earlier to alert them.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>9) Backing (Most Preventable Incidents)</Text>
            <Text style={styles.sectionParagraph}>GOAL—Get Out And Look. Every time the picture isn’t perfect, stop and check.</Text>
            <Text style={styles.sectionParagraph}>
              Use a spotter if available, agree on clear hand signals, and stop if you lose sight of them.
            </Text>
            <Text style={styles.sectionParagraph}>
              Take your time: Straighten the trailer before turning; small corrections beat big ones.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>10) Fatigue, Distraction &amp; Impairment (Zero Tolerance)</Text>
            <Text style={styles.sectionParagraph}>
              Fatigue: If your head nods or you miss a sign, you’re already too tired. Park and rest.
            </Text>
            <Text style={styles.sectionParagraph}>
              Phones: No hand-held use while moving. If dispatch or navigation needs attention, pull over safely.
            </Text>
            <Text style={styles.sectionParagraph}>
              Medications/substances: Know how they affect alertness. If you’re not 100%, don’t roll.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>11) Vehicle Condition (Your Equipment Must Be Ready)</Text>
            <Text style={styles.sectionParagraph}>
              Pre-trip, en-route, post-trip inspections: Brakes, tires, lights, coupling, airlines, leaks, and load
              securement every time.
            </Text>
            <Text style={styles.sectionParagraph}>
              Tires: Maintain manufacturer-recommended pressures. Replace when tread is low (commonly 4/32" steer,
              2/32" drive/trailer minimums).
            </Text>
            <Text style={styles.sectionParagraph}>
              Brakes: If you notice pulling, fade, or a soft pedal, address it immediately—don’t “watch and wait.”
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>12) Load Securement (Stable Loads Drive Safely)</Text>
            <Text style={styles.sectionParagraph}>
              Check at start, again at 50 miles, then every 150 miles/3 hours or at duty status change.
            </Text>
            <Text style={styles.sectionParagraph}>
              Even light loads need securement. Shifting cargo changes handling and braking.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>13) Communication (Let Others Know Your Plan)</Text>
            <Text style={styles.sectionParagraph}>Signal early and clearly.</Text>
            <Text style={styles.sectionParagraph}>Headlights on in rain/low light.</Text>
            <Text style={styles.sectionParagraph}>
              Use four-ways when approaching a stop on high-speed roads or when crawling significantly below traffic
              speed.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>14) Breakdowns &amp; Emergencies (Control the Scene)</Text>
            <Text style={styles.sectionParagraph}>
              Get off the roadway if possible; if not, move as far right as you safely can, angle wheels away from
              traffic.
            </Text>
            <Text style={styles.sectionParagraph}>
              Triangles/flares: Place per DOT guidance so approaching drivers have time to react (on two-way roads: one
              in front and two behind; on divided highways: all three behind, spaced to warn early).
            </Text>
            <Text style={styles.sectionParagraph}>
              Stay visible: High-visibility vest, lights on, hood up if safe to signal distress.
            </Text>
            <Text style={styles.sectionParagraph}>
              If a collision occurs: Protect people first, call for help, secure the scene, photograph, and
              document—no roadside arguments.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily “Micro-Habits” That Prevent Big Problems</Text>
            <Text style={styles.sectionParagraph}>Rebuild a 7-second gap anytime it shrinks.</Text>
            <Text style={styles.sectionParagraph}>Mirrors every 5–8 seconds—always know who’s on your flanks.</Text>
            <Text style={styles.sectionParagraph}>Ease off throttle the moment visibility shrinks or hazards appear.</Text>
            <Text style={styles.sectionParagraph}>Keep an escape lane; don’t pace next to others.</Text>
            <Text style={styles.sectionParagraph}>Signal early, then make only one smooth move.</Text>
            <Text style={styles.sectionParagraph}>Hydrate, eat light, and rest—alert drivers make smooth decisions.</Text>
            <Text style={styles.sectionParagraph}>
              Recheck load and tires at the first stop and routinely thereafter.
            </Text>
          </View>

          <Text style={styles.bottomLine}>
            Bottom line: Protect space, control speed, and stay predictable. Do those three things consistently, and you
            dramatically cut your risk—no matter what the road throws at you.
          </Text>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingVertical: 24,
  },
  introTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  introText: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 4,
  },
  section: {
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    padding: 18,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 10,
    lineHeight: 24,
  },
  sectionParagraph: {
    fontSize: 15,
    color: Colors.black,
    lineHeight: 22,
    marginBottom: 6,
  },
  bottomLine: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    lineHeight: 24,
    marginTop: 6,
  },
});
