// Screen transition presets for the native stack. Kept here so navigators share
// one set of timings rather than each declaring its own.
export const screenTransitions = {
  push: {
    animation: 'slide_from_right',
    animationDuration: 260,
  },
  modal: {
    animation: 'slide_from_bottom',
    animationDuration: 300,
  },
  fade: {
    animation: 'fade',
    animationDuration: 200,
  },
};

export default screenTransitions;
