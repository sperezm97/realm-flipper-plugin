import { Radio, RadioChangeEvent, Button, Row, Col } from "antd";
import { TypeInputProps } from "./TypeInput";
import React, { useState } from "react";
import { ClearOutlined } from "@ant-design/icons";

export const BoolInput = ({ property, set, value }: TypeInputProps) => {
  const [_, setReset] = useState(0);

  const options = [
    {
      label: "True",
      value: "True",
    },
    {
      label: "False",
      value: "False",
    },
  ];
  const onChange = ({ target: { value } }: RadioChangeEvent) => {
    set(value === "True");
  };
  return (
    
    <Row align="middle" style={{ background: 'white'}}>
      <Col flex="auto">
      <Radio.Group
        defaultValue={value === null ? undefined : value ? "True" : "False"}
        options={options}
        onChange={onChange}
        optionType="button"
        value={value === null ? undefined : value ? "True" : "False"}
      />
      </Col>


      {property.optional ? (
        <Col>
          <Button
          icon={<ClearOutlined />}
          onClick={() => {
            set(null);
            setReset((v) => v + 1);
          }}
        >
        </Button>
        </Col>
      ) : null}
    </Row>
  );
};