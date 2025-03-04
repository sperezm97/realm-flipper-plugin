import { usePlugin } from 'flipper-plugin';
import React, { useEffect, useRef, useState } from 'react';
import { plugin } from '..';
import { RealmObject, SchemaObject, SchemaProperty } from '../CommonTypes';
import {
  CustomDropdown,
  DropdownPropertyType,
  MenuItemGenerator,
} from '../components/CustomDropdown';
import { DataTable, schemaObjToColumns } from '../components/DataTable';
import { FieldEdit } from '../components/objectManipulation/FieldEdit';
import { ObjectEdit } from '../components/objectManipulation/ObjectEdit';
import {
  InspectionDataType,
  RealmDataInspector,
} from '../components/RealmDataInspector';

type PropertyType = {
  objects: Array<RealmObject>;
  schemas: Array<SchemaObject>;
  currentSchema: SchemaObject;
  sortingDirection: 'ascend' | 'descend' | null;
  sortingColumn: string | null;
  hasMore: boolean;
  totalObjects?: number;
  enableSort: boolean;
  clickAction?: (object: RealmObject) => void;
  fetchMore: () => void;
  handleDataInspector?: () => void;
};

const DataVisualizer = ({
  objects,
  schemas,
  currentSchema,
  sortingDirection,
  sortingColumn,
  hasMore,
  totalObjects,
  enableSort,
  clickAction,
  fetchMore,
}: PropertyType) => {
  /** Hooks to manage the state of the DataInspector and open/close the sidebar. */
  const [inspectionData, setInspectionData] = useState<InspectionDataType>();
  const [showSidebar, setShowSidebar] = useState(false);
  const [goBackStack, setGoBackStack] = useState<Array<InspectionDataType>>([]);
  const [goForwardStack, setGoForwardStack] = useState<Array<RealmObject>>([]);

  /** Hook to open/close the editing dialog and set its properties. */
  const [editingObject, setEditingObject] = useState<{
    editing: boolean;
    object?: RealmObject;
    // schemaProperty?: SchemaProperty;
    type?: 'field' | 'object';
    fieldName?: string;
  }>({
    editing: false,
  });
  const pluginState = usePlugin(plugin);
  const { removeObject } = pluginState;

  /** refs to keep track of the current scrolling position for the context menu */
  const scrollX = useRef(0);
  const scrollY = useRef(0);

  /** Functions for deleting and editing rows/objects */
  const deleteRow = (row: RealmObject) => {
    removeObject(row);
  };
  const editField = (row: RealmObject, schemaProperty: SchemaProperty) => {
    setEditingObject({
      editing: true,
      object: row,
      type: 'field',
      fieldName: schemaProperty.name,
    });
  };
  const editObject = (row: RealmObject) => {
    setEditingObject({
      editing: true,
      object: row,
      type: 'object',
    });
  };

  /**  Generate MenuItem objects for the context menu with all necessary data and functions.*/
  const generateMenuItems: MenuItemGenerator = (
    row: RealmObject,
    schemaProperty: SchemaProperty,
    schema: SchemaObject
  ) => [
    {
      key: 1,
      text: 'Inspect Object',
      onClick: () => {
        const object: RealmObject = {};
        Object.keys(row).forEach((key) => {
          object[key as keyof RealmObject] = row[key];
        });
        setNewInspectionData({
          data: {
            [schema.name]: object,
          },
          view: 'object',
        },true);
      },
    },
    {
      key: 2,
      text: 'Inspect Property',
      onClick: () => {
        setNewInspectionData({
          data: {
            [schema.name + '.' + schemaProperty.name]: row[schemaProperty.name],
          },
          view: 'property',
        },true);
      },
    },
    {
      key: 3,
      text: 'Edit Object',
      onClick: () => editObject(row),
    },
    {
      key: 4,
      text: 'Edit Property',
      onClick: () => editField(row, schemaProperty),
    },
    {
      key: 5,
      text: 'Delete Object',
      onClick: () => deleteRow(row),
    },
  ];

  /**  Managing dropdown properties.*/
  const [dropdownProp, setdropdownProp] = useState<DropdownPropertyType>({
    generateMenuItems,
    currentSchema: currentSchema,
    record: {},
    schemaProperty: null,
    visible: false,
    pointerX: 0,
    pointerY: 0,
    scrollX: 0,
    scrollY: 0,
  });

  /** Hook to close the dropdown when clicked outside of it. */
  useEffect(() => {
    const closeDropdown = () => {
      setdropdownProp({ ...dropdownProp, visible: false });
    };
    document.body.addEventListener('click', closeDropdown);
    return () => document.body.removeEventListener('click', closeDropdown);
  }, []);

  /** Handler to keep track of the current x and y position of the scrollcontainer. This is needed to render the dropdown in the correct place when scrolled. */
  const handleScroll = (event: React.BaseSyntheticEvent) => {
    const { scrollLeft, scrollTop } = event.target;
    scrollX.current = scrollLeft;
    scrollY.current = scrollTop;
  };

  if (!currentSchema) {
    return <div>Please select a schema.</div>;
  }

  if (!schemas || !schemas.length) {
    return <div>No schemas found. Check selected Realm.</div>;
  }

  /** Take the current dropdownProp and update it with the current x and y scroll values.
   This cannot be done with useState because it would cause too many rerenders.*/
  const updatedDropdownProp = {
    ...dropdownProp,
    scrollX: scrollX.current,
    scrollY: scrollY.current,
  };

  return (
    <div
      onScroll={handleScroll}
      style={{
        flex: `1 1 0`,
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: '100%',
        }}
      >
        {editingObject.editing && editingObject.type === 'object' ? (
          <ObjectEdit
            schema={currentSchema}
            initialObject={editingObject.object as RealmObject}
            setVisible={(val: boolean) => {
              setEditingObject((obj) => ({
                ...obj,
                editing: val,
              }));
            }}
            visible={editingObject.editing}
          ></ObjectEdit>
        ) : editingObject.editing &&
          editingObject.type === 'field' &&
          editingObject.object ? (
          <FieldEdit
            schema={currentSchema}
            fieldName={editingObject.fieldName as string}
            setVisible={(val: boolean) => {
              setEditingObject((obj) => ({
                ...obj,
                editing: val,
              }));
            }}
            visible={editingObject.editing}
            value={editingObject.object}
          />
        ) : null}
        <DataTable
          columns={schemaObjToColumns(currentSchema)}
          objects={objects}
          schemas={schemas}
          hasMore={hasMore}
          sortingDirection={sortingDirection}
          sortingColumn={sortingColumn}
          currentSchema={currentSchema}
          totalObjects={totalObjects}
          generateMenuItems={generateMenuItems}
          setdropdownProp={setdropdownProp}
          dropdownProp={dropdownProp}
          scrollX={scrollX.current}
          scrollY={scrollY.current}
          enableSort={enableSort}
          setNewInspectionData={setNewInspectionData}
          fetchMore={fetchMore}
          clickAction={clickAction}
        />
        <CustomDropdown {...updatedDropdownProp} />
        <RealmDataInspector
          schemas={schemas}
          inspectionData={inspectionData}
          setInspectionData={setInspectionData}
          showSidebar={showSidebar}
          setShowSidebar={setShowSidebar}
          goBackStack={goBackStack}
          setGoBackStack={setGoBackStack}
          goForwardStack={goForwardStack}
          setGoForwardStack={setGoForwardStack}
          setNewInspectionData={setNewInspectionData}
        />
      </div>
    </div>
  );

  // update inspectionData and push object to GoBackStack
  function setNewInspectionData(
    newInspectionData: InspectionDataType,
    wipeStacks?: boolean
  ) {
    showSidebar ? null : setShowSidebar(true);
    if (inspectionData !== undefined && !wipeStacks) {
      goBackStack.push(inspectionData);
      setGoBackStack(goBackStack);
      setGoForwardStack([]);
    } else if (wipeStacks) {
      setGoBackStack([]);
      setGoForwardStack([]);
    }
    setInspectionData(newInspectionData);
  }
};

export default DataVisualizer;
