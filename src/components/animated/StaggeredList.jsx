import React, { Children } from 'react';
import FadeInSection from './FadeInSection';

// Cascades a set of rows in. Lists want a tighter step than page sections do,
// otherwise a long list is still arriving after the user has started reading it.
export default function StaggeredList({ children, step = 45, rise, delay = 0, style, itemStyle }) {
  const items = Children.toArray(children);

  return (
    <>
      {items.map((child, index) => (
        <FadeInSection
          key={child.key ?? index}
          index={index}
          step={step}
          rise={rise}
          delay={delay}
          style={itemStyle ?? style}
        >
          {child}
        </FadeInSection>
      ))}
    </>
  );
}
