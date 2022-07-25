import { Button, Input } from "antd";
import React, { useState } from "react";
import { TypeInputProps } from "./CommonInput";
import uuid from 'react-native-uuid';

export const UUIDInput = ({
  property,
  value,
  setter,
  inputReset,
}: TypeInputProps) => {
  const onChange = (value: string) => {
    console.log('onchange', value);
    // setContent(value);
    setter(value);
  };
  // TODO handling invalid uuids?
  return (
    <Input.Group>
    <Input
      key={inputReset}
      value={value}
      onChange={v => onChange(v.target.value)}
      placeholder={property.optional ? "null" : undefined}
      allowClear={property.optional}
      status={uuid.validate(value) ? "" : "error"}
    />
    <Button onClick={() => { 
        setter(uuid.v4().toString())
        // setter(content);
        } }>
        refresh
    </Button>
    </Input.Group>

  );
};
