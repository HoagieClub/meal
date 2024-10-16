/**
 * @overview Sample page 1 for the Hoagie Meal app.
 *
 * Copyright © 2021-2024 Hoagie Club and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree or at https://github.com/hoagieclub/template/LICENSE.
 *
 * Permission is granted under the MIT License to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the software. This software is provided "as-is", without warranty of any kind.
 */

'use client';

import { useState } from 'react';
import { RadioGroup, Text, Heading, Pane, majorScale, Spinner, Button, Alert } from 'evergreen-ui';
import Link from 'next/link';
import { useUser } from '@auth0/nextjs-auth0/client';
import View from '@/components/View';

export default function Feature1() {
  const { user, error, isLoading } = useUser();

  // If the user data is loading, show a spinner.
  if (isLoading) return <Spinner />;

  // If there is an error, display the error message.
  if (error) return <div>{error.message}</div>;

  // Option 1: Documentation information.
  const option1 = (
    <Pane>
      <Text size={500}>
        <b>Documentation</b>
        <br />
      </Text>
      <Text size={400}>
        Exceptional software engineers <b>devour</b> documentation. Read the Hoagie docs!
      </Text>
    </Pane>
  );

  // Option 2: UI Library information.
  const option2 = (
    <Pane>
      <Text size={500}>
        <b>UI Library</b>
        <br />
      </Text>
      <Text size={400}>
        Our UI Design is mainly powered by the <b>Evergreen</b> library.
      </Text>
    </Pane>
  );

  // Option 3: Components Library information.
  const option3 = (
    <Pane>
      <Text size={500}>
        <b>Components Library</b>
        <br />
      </Text>
      <Text size={400}>
        Complementary to Evergreen, we use the <b>ShadCN</b> library to compose beautiful
        components.
      </Text>
    </Pane>
  );

  // State for radio group options and selected value.
  const [options] = useState([
    { label: option1, value: 'docs' },
    { label: option2, value: 'ui' },
    { label: option3, value: 'components' },
  ]);
  const [optionValue, setOptionValue] = useState('docs');

  /**
   * Returns the appropriate URL based on the selected option.
   *
   * @returns {string} The URL to navigate to based on the selected option.
   */
  const getNextUrl = () => {
    switch (optionValue) {
      case 'docs':
        return 'https://docs.hoagie.io/';
      case 'ui':
        return 'https://evergreen.segment.com/foundations';
      case 'components':
        return 'https://ui.shadcn.com/';
      default:
        return '/';
    }
  };

  // Render buttons for navigating to the selected resource or going back.
  const bottomButtons = (
    <Pane>
      <Link href={getNextUrl()} target='_blank'>
        <Button size='large' appearance='primary' float='right'>
          Learn More
        </Button>
      </Link>
      <Link href='/'>
        <Button size='large' float='left'>
          Back
        </Button>
      </Link>
    </Pane>
  );

  // Render the radio group form for selecting a resource option.
  const SelectForm = (
    <Pane marginBottom={majorScale(4)}>
      <Heading size={900} marginTop={majorScale(2)} marginBottom={majorScale(1)}>
        Hi, {user?.name}
      </Heading>
      <Text size={500}>Welcome to the template app! Here are some resources to get started:</Text>
      <RadioGroup
        size={16}
        value={optionValue}
        options={options}
        isRequired
        marginTop={majorScale(3)}
        onChange={(event) => setOptionValue(event.target.value)}
      />
    </Pane>
  );

  return (
    <View>
      {SelectForm}
      <Pane marginBottom={32}>
        <Alert intent='warning' title='NOTE!' marginTop={24}>
          This is a Hoagie Meal app. You are encouraged to change things and play around with it!
        </Alert>
      </Pane>
      {bottomButtons}
    </View>
  );
}
