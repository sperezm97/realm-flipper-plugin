import { Layout } from 'flipper-plugin';
import React from 'react';
import { SchemaObject, RealmObject } from '../CommonTypes';
import DataVisualizer from '../pages/DataVisualizer';

import { DataTabHeader } from './DataTabHeader';
import SchemaSelect from './SchemaSelect';

type InputType = {
  schemas: SchemaObject[];
  objects: RealmObject[];
  currentSchema: SchemaObject;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  hasMore: boolean;
  totalObjects: number;
  fetchMore: () => void;
};

export const DataVisualizerWrapper = ({
  schemas,
  objects,
  currentSchema,
  sortingDirection,
  sortingColumn,
  hasMore,
  fetchMore,
  totalObjects
}: InputType) => {
  return (
    <>
      <SchemaSelect schemas={schemas} />
      <Layout.Container style={{height: "90%"}}>
        <DataTabHeader totalObjects={totalObjects} currentSchema={currentSchema} />
        <DataVisualizer
          objects={objects}
          schemas={schemas}
          hasMore={hasMore}
          currentSchema={currentSchema}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
          enableSort={true}
          fetchMore={fetchMore}
        />
      </Layout.Container>
    </>
  );
};
