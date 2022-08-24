import {Flipper} from 'react-native-flipper';

type getObjectsQuery = {
  schema: string;
  realm: string;
  cursorId: number;
  filterCursor: number | string;
  limit: number;
  sortingDirection: 'ascend' | 'descend';
  sortingColumn: string;
  sortingColumnType: string;
};
export class Query {
  reqFilterCursor;
  reqCursorId;
  limit;
  sortingColumn;
  sortingColumnType;
  sortingDirection;
  objects: Realm.Results<Realm.Object>;

  constructor(req: getObjectsQuery, objects: Realm.Results<Realm.Object>) {
    const {
      limit,
      sortingColumn,
      sortingDirection,
      cursorId,
      filterCursor,
      sortingColumnType,
    } = req;
    this.limit = limit;
    this.sortingColumn = sortingColumn;
    this.sortingColumnType = sortingColumnType;
    this.sortingDirection = sortingDirection;
    this.reqCursorId = cursorId;
    this.reqFilterCursor = filterCursor;
    this.objects = objects;
  }

  getObjectsByPagination() {
    let filterCursor: string | number | null = null;
    const shouldSortDescending = this.sortingDirection === 'descend';
    const cursorId =
      this.reqCursorId ??
      this.objects.sorted('_id', shouldSortDescending)[0]._id;
    if (this.sortingColumn) {
      filterCursor =
        this.reqFilterCursor ??
        this.objects.sorted(`${this.sortingColumn}`, shouldSortDescending)[0][
          this.sortingColumn
        ];
    }
    if (shouldSortDescending) {
      this.objects = this.getObjectsDescending(cursorId, filterCursor);
    } else {
      this.objects = this.getObjectsAscending(cursorId, filterCursor);
    }
    return this.objects;
  }

  getObjectsDescending(cursorId, filterCursor) {
    this.objects = this.objects
      .sorted([
        [`${this.sortingColumn}`, true],
        ['_id', true],
      ])
      .filtered(
        `${this.sortingColumn} ${!this.reqFilterCursor ? '<=' : '<'} ${
          this.sortingColumnType === 'uuid'
            ? `uuid(${filterCursor})`
            : `${cursorId}`
        } || (${this.sortingColumn} == ${
          this.sortingColumnType === 'uuid'
            ? `uuid(${filterCursor})`
            : `${cursorId}`
        } && _id ${!this.reqCursorId ? '<=' : '<'} ${
          this.sortingColumnType === 'uuid'
            ? `uuid(${cursorId})`
            : `${cursorId}`
        }) LIMIT(${this.limit})`,
        filterCursor,
        cursorId,
      );
    return this.objects;
  }

  getObjectsAscending(cursorId: number, filterCursor: number | string | null) {
    if (this.sortingColumn) {
      this.objects = this.objects
        .sorted([
          [`${this.sortingColumn}`, false],
          ['_id', false],
        ])
        .filtered(
          `${this.sortingColumn} ${!this.reqFilterCursor ? '>=' : '>'} ${
            this.sortingColumnType === 'uuid'
              ? `uuid(${filterCursor})`
              : `${filterCursor}`
          } || (${this.sortingColumn} == ${filterCursor} && _id ${
            !this.reqCursorId ? '>=' : '>'
          } ${
            this.sortingColumnType === 'uuid'
              ? `uuid(${cursorId})`
              : `${cursorId}`
          }) LIMIT(${this.limit})`,
        );
    } else {
      this.objects = this.objects
        .sorted('_id', false)
        .filtered(
          `_id ${!this.reqCursorId ? '>=' : '>'} ${
            this.sortingColumnType === 'uuid'
              ? `uuid(${cursorId})`
              : `${cursorId}`
          } LIMIT(${this.limit})`,
          cursorId,
        );
    }
    return this.objects;
  }
}
