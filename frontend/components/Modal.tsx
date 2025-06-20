'use client';

import React from 'react';
import { Dialog, Pane, Text, Link, useTheme, majorScale, minorScale } from 'evergreen-ui';

interface UIMenuItem {
  name: string;
  description: string;
  link: string;
}

interface HallMenuModalProps {
  isShown: boolean;
  onClose: () => void;
  hall: UIVenue | null;
}

interface UIVenue {
  name: string;
  items: Record<'Main Entrée' | 'Vegetarian + Vegan Entrée' | 'Soups', UIMenuItem[]>;
  allergens: Set<string>;
  calories: Record<string, number>;
  protein: Record<string, number>;
}

const ALLERGEN_EMOJI: Record<string, string> = {
  peanut: '🥜',
  'tree nut': '🌰',
  egg: '🥚',
  dairy: '🥛',
  wheat: '🌾',
};

interface HallMenuModalProps {
  isShown: boolean;
  onClose: () => void;
  hall: UIVenue | null;
}

const HallMenuModal: React.FC<HallMenuModalProps> = ({ isShown, onClose, hall }) => {
  const theme = useTheme();

  if (!hall) return null;

  const renderSection = (label: keyof UIVenue['items']) => {
    const items = hall.items[label];
    return (
      <Pane>
        <Text size={400} fontWeight={600}>
          {label}
        </Text>
        {items.length === 0 ? (
          <Pane>
            <Text size={300} color='muted' fontStyle='italic' marginTop={minorScale(1)}>
              Nothing available
            </Text>
          </Pane>
        ) : (
          <Pane
            display='grid'
            gridTemplateColumns='2fr 1fr 1fr'
            rowGap={minorScale(1)}
            marginTop={minorScale(1)}
          >
            {items.map((item) => (
              <React.Fragment key={item.name}>
                <Pane display='flex' flexDirection='column'>
                  <Link href={item.link}>
                    <Text color='green800' fontWeight={500}>
                      {item.name}
                    </Text>
                  </Link>
                  <Pane display='flex' gap={minorScale(1)} marginTop={minorScale(1)}>
                    {Array.from(hall.allergens)
                      .filter((a) => item.description.toLowerCase().includes(a.toLowerCase()))
                      .map((a) => (
                        <Pane
                          key={a}
                          display='inline-flex'
                          alignItems='center'
                          justifyContent='center'
                          width={24}
                          height={24}
                          borderRadius={12}
                          background={theme.colors.green100}
                          border={`1px solid ${theme.colors.green700}`}
                        >
                          <Text size={200}>{ALLERGEN_EMOJI[a.toLowerCase()]}</Text>
                        </Pane>
                      ))}
                  </Pane>
                </Pane>
                <Text size={300} textAlign='right'>
                  {hall.calories[item.name]}
                </Text>
                <Text size={300} textAlign='right'>
                  {hall.protein[item.name]}
                </Text>
              </React.Fragment>
            ))}
          </Pane>
        )}
      </Pane>
    );
  };

  return (
    <Dialog
      isShown={isShown}
      title={`${hall.name} — Full Menu`}
      onCloseComplete={onClose}
      hasFooter={false}
      width='80vw'
    >
      <Pane paddingBottom={majorScale(5)}>
        {renderSection('Main Entrée')}
        {renderSection('Vegetarian + Vegan Entrée')}
        {renderSection('Soups')}
      </Pane>
    </Dialog>
  );
};

export default HallMenuModal;
