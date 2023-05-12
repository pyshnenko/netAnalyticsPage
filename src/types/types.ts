export interface date {
    year: number,
    month: number|undefined,
    day: number|undefined
}

export interface time {
    hour: number,
    minute: number
}

export enum format {
    full,
    onlyTime,
    onlyDate,
    myDate,
    yDate,
    iso
}