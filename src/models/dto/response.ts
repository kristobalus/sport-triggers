
export interface ResponseItem<T = any> {
  id: string
  type: string
  attributes: T
}

export interface Response<T = any> {
  data: T
}

export interface ItemResponse<T = any> {
  data: ResponseItem<T>
}

export interface ListResponse<T = any> {
  data: ResponseItem<T>[]
}

export function toResponseItem<T>(id: string, type: string, data: T): ResponseItem<T> {
  return {
    id: id,
    type,
    attributes: data,
  }
}


