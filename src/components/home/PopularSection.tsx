// src/components/PopularSection.tsx
import React from 'react';
import breath from '@/assets/images/breath.png';
import affirmation from '@/assets/images/Affirmation.png';
import mood from '@/assets/images/moodjournal.png';
import pineal from '@/assets/images/pineal activation.png';
import excerise from '@/assets/images/breath excerise.png';
import healexcerise from '@/assets/images/excerise.png';

export const PopularSection: React.FC = () => {
const items = [
  {
    title: "Breathing Exercise",
    subtitle: "Calm your mind and enhance focus with guided rhythmic breathing techniques.",
    image: breath,
  },
  {
    title: "Affirmations",
    subtitle: "Empower your mindset with positive daily affirmations to boost confidence and inner peace.",
    image: affirmation,
  },
  {
    title: "Mood Journal",
    subtitle: "Track your emotions mindfully and gain deeper insight into your emotional patterns.",
    image: mood,
  },
  {
    title: "Pineal Activation",
    subtitle: "Stimulate your third eye with light, sound, and meditation to enhance intuition and clarity.",
    image: pineal,
  },
  {
    title: "Breathwork Flow",
    subtitle: "Engage in transformative breathwork to release stress and elevate your energy.",
    image: excerise,
  },
  {
    title: "Guided Breathing",
    subtitle: "Follow soothing breathing patterns to relax, recharge, and restore balance.",
    image: healexcerise,
  },
];

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2
          className="mb-0"
          style={{
            fontSize: '1.25rem', // text-xl
            fontWeight: 600,
          }}
        >
          Most Popular
        </h2>
     
      </div>

      {/* Cards Grid */}
      <div className="row g-3">
        {items.map((item, index) => (
          <div key={index} className="col-12 col-sm-6 col-lg-4 col-xxl-2">
            <div
              className="rounded-4 overflow-hidden cursor-pointer flex-fill"
              style={{
                backgroundColor: '#1e2123',
                transition: 'background-color 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2a2e30';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1e2123';
              }}
            >
              {/* Image */}
              <img
                src={item.image }
                alt={item.title}
                style={{
                  width: '100%',
                  height: '196px', 
                  // objectFit: 'cover',
                }}
              />

              {/* Text Content */}
              <div className="p-3">
                <h3
                  className="mb-1"
                  style={{
                    fontSize: '1.2rem', 
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  {item.title}
                </h3>
                <p
                  className="mb-0"
                  style={{
                    fontSize: '0.75rem', 
                    color: '#cccccc', 
                  }}
                >
                  {item.subtitle}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularSection;