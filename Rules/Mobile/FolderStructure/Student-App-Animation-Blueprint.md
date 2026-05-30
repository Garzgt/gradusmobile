# Student App Animation Blueprint

This blueprint defines animation standards for a polished student app experience.

## 1. Motion Goals

1. Improve clarity of state transitions.
2. Keep interactions smooth and responsive.
3. Avoid decorative motion that slows user tasks.

## 2. Motion Layers

1. Screen entry and exit
2. List reveal and reordering
3. Card feedback on tap
4. Loading and skeleton states
5. Status success or failure feedback

## 3. Required Animation Components

1. AnimatedScreenWrapper
2. FadeInSection
3. StaggeredList
4. ParallaxHeader
5. FloatingActionButton
6. SkeletonLoader and shimmer pulse

## 4. Required Animation Hooks

1. useStaggerIn
2. useParallaxMotion
3. useShimmerPulse
4. useReducedMotion

## 5. Timing Guidance

1. Tap feedback: 80ms to 140ms
2. Card reveal: 180ms to 260ms
3. Screen transition: 220ms to 320ms
4. List stagger delay: 25ms to 45ms per item

## 6. Student Flow Animation Targets

1. Login success transition
2. Evaluation scan success
3. Irregular conflict check feedback
4. Advising form download confirmation
5. Enrollment status updates
6. Grade posted update highlight
7. Recognition badge reveal

## 7. Accessibility Rule

1. All non-essential motion must reduce when reduced-motion is enabled.
2. Critical state feedback must still be visible without animation.

## 8. Responsive Motion Rule

1. Keep motion distance shorter on small phones to reduce perceived lag.
2. Adapt list and card reveal density for tablet and landscape layouts.
3. Avoid parallax-heavy motion on constrained devices or low-performance mode.
4. Preserve clear status feedback regardless of orientation or screen size.
