import { SchemaObject } from '../CommonTypes';
import React from 'react';
import BooleanValue from '../components/BooleanValue';
import { Button, message, Typography } from 'antd';
import fileDownload from 'js-file-download'

type TypeDescription = {
  type: string;
  objectType?: string;
};

export const renderValue = (
  value: unknown,
  property: TypeDescription,
  schemas: SchemaObject[],
  inner?: boolean,
) => {
  if (value === null) {
    return inner ? "null" : <Typography.Text disabled>null</Typography.Text>;
  }
  if (value === undefined) {
    return inner ? "undefined" : <Typography.Text disabled>undefined</Typography.Text>;
  }
  let schema;
  let returnValue: JSX.Element | string | number = '';

  switch (property.type) {
    case 'string':
      returnValue = parseSimpleData(value);
      break;
    case 'double':
    case 'int':
    case 'float':
    case 'objectId':
    case 'date':
    case 'uuid': //@ts-ignore --> These type errors are okay because the Realm data types guarantee type safety here.
      returnValue = parseSimpleData(value);
      break;
    case 'bool': //@ts-ignore
      returnValue = parseBoolean(value);
      break;
    case 'list':
    case 'set': //@ts-ignore
      //@ts-ignore
      returnValue = parseSetOrList(value, property, schemas);
      break;
    case 'data': //@ts-ignore
      returnValue = parseData(value);
      break;
    case 'dictionary': //@ts-ignore
      returnValue = parseDictionary(value);
      break;
    case 'decimal128': //@ts-ignore
      returnValue = parseDecimal128(value);
      break;
    case 'object': //@ts-ignore
      schema = schemas.find((schema) => schema.name === property.objectType);
      returnValue = parseLinkedObject(schema as SchemaObject, value);
      break;
    case 'mixed':
      returnValue = parseMixed(value, schemas);
      break;
  }

  return returnValue;
};

function parseSimpleData(input: string | number): string | number {
  return input;
}

function parseSetOrList(input: unknown, property: TypeDescription, schemas: SchemaObject[]): string {
  const output = input.map((value: unknown) => {
    // check if the container holds objects
    if (schemas.some(schema => schema.name === property.objectType)) {
      return renderValue(value, {
        type: 'object',
        objectType: property.objectType,
      }, schemas, true);
    }

    return renderValue(value, {
      type: property.objectType as string,
    }, schemas, true);
  });

  return '[' + output + ']';
}

function parseDictionary(input: Record<string, unknown>): string {
  return JSON.stringify(input);
}

function parseData(input) {
  if (input.downloadData === undefined) {
    return <Typography.Text disabled>data</Typography.Text>;
  }
  /* Structure of binary data:
  input: {
    downloadData: () => Promise<{ data: Uint8Array }>,
    length,
  }
  */
  const handleDownload = () => {
    (input.downloadData() as Promise<{
      data: number[], 
    }>).then(res => {
      fileDownload(new Uint8Array(res.data).buffer, 'data');
    }, reason => {
      message.error('downloading failed', reason.message);
    });
  };
  return (
    <Button onClick={handleDownload}>[{input.length} bytes]</Button>
  )
}

function parseBoolean(input: boolean): JSX.Element {
  const inputAsString = input.toString();

  return <BooleanValue active={input} value={inputAsString} />
}

function parseDecimal128(input: { $numberDecimal: string }): string {
  return input.$numberDecimal ?? input;
}

function parseLinkedObject(
  schema: SchemaObject,
  linkedObj: Record<string, unknown>
): string {
  let returnValue = '';
  const childSchema: SchemaObject | undefined = schema;
  if (childSchema.primaryKey != undefined && childSchema !== undefined) {
    returnValue =
      '[' +
      childSchema.name +
      ']' +
      '.' +
      childSchema.primaryKey +
      ': ' +
      linkedObj[childSchema.primaryKey];
  }
  else {
    returnValue = '[' + childSchema.name + ']._objectKey: ' + linkedObj._objectKey;
  }

  return returnValue;
}

function parseMixed(
  input: any,
  schemas: SchemaObject[]
): string | JSX.Element | number {
  return JSON.stringify(input);
}
