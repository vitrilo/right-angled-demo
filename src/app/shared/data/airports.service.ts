import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import * as _ from 'lodash';
import { ListRequest, ListResponse, SortDirection, SortParameter } from 'right-angled';
import { Observable } from 'rxjs/Observable';

import { Airport } from './airport';
import { AirportsListRequest } from './airports-list-request';

@Injectable()
export class AirportsService {
    public static maxPageSize: number = 200;
    private airportsUrl: string = './assets/airports.json';
    constructor(private http: Http) {

    }
    private applyRequest(request: ListRequest, data: Airport[]): ListResponse<Airport> {
        let response = {
            items: null,
            loadedCount: 0,
            totalCount: data.length
        } as ListResponse<Airport>;
        let take = request.take ? (request.take > AirportsService.maxPageSize ? AirportsService.maxPageSize : request.take) : data.length;
        let skip = request.skip || 0;

        let sortedRecords = this.applySortings(request.sortings, data);
        response.items = _.slice(sortedRecords, skip, skip + take);
        response.loadedCount = response.items.length;
        return response;
    }
    private applySortings(sortings: SortParameter[], data: Airport[]): Airport[] {
        let fieldNames = sortings.map(sort => (sort.fieldName));
        let directions = sortings.map(sort => (sort.direction === SortDirection.Asc ? 'asc' : 'desc'));
        return _.orderBy(data, fieldNames, directions);
    }

    private getFilteredAirports(request: AirportsListRequest, delay: number): Observable<Array<Airport>> {
        return this.getAirports(delay).map(airports => {
            return _.chain(airports)
                .filter(item => !request.airportName || item.name.toLowerCase().indexOf(request.airportName.toLowerCase()) !== -1)
                .filter(item => request.size === null || request.size === undefined || (item.size === null && request.size === '') || item.size === request.size)
                .filter(item => !request.type || item.type === request.type)
                .filter(item => !request.regionName || item.region === request.regionName)
                .filter(item => !request.cityName || item.cityName === request.cityName)
                .filter(item => !request.countryName || item.countryName === request.countryName)
                .forEach(item => { (item as any).selected = false; })
                .value();
        });
    }
    public getAirports(delay: number = 500): Observable<Array<Airport>> {
        // we use optional "delay" parameter to simulate backend latency
        return this.http.get(this.airportsUrl)
            .map(response => (response.json().airports as Array<Airport>))
            .delay(delay);
    }

    public getAirportsList(request: AirportsListRequest, delay: number = 500): Observable<ListResponse<Airport>> {
        return this.getFilteredAirports(request, delay).map(airports => this.applyRequest(request, airports));
    }
}