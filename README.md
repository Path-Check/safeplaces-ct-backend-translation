# SafePlaces Translation Service

The SafePlaces Translation Service is a private standalone API that is utilized by the SafePlaces Frontend to create, delete, update, and query for GPS points associated with a case or set of cases.

GPS Points are collected by the SafePlaces mobile application and persisted across the public and private databases in discreet format. In discreet format, each GPS point consists of a latitude, longitude, a time, and implicitly represents a five minute window of time with the beginning of the five minute window relative to the time property. An example of three consecutive data points (consecutively five minutes apart from each other) in discreet format would look like the following:

```
[
  {
    "longitude": 14.91328448,
    "latitude": 41.24060321,
    "time": "2020-05-30T18:25:00.511Z"
  },
  {
    "longitude": 14.91328448,
    "latitude": 41.24060321,
    "time": "2020-05-30T18:30:00.511Z"
  },
  {
    "longitude": 14.91328448,
    "latitude": 41.24060321,
    "time": "2020-05-30T18:35:00.511Z"
  }  
]
```

The contact tracing tool in the SafePlaces Frontend represents points as a function of time spent in a single location. This necessitates the translation of GPS point data from discreet format (above) to duration format. The three points in the above discreet format example would become a single GPS point consisting of latitude, longitude, time (start time), and duration, like the following example, when translated to duration format:

```
{
  "discreetPointIDs": [21, 22, 23],
  "longitude": 14.91328448,
  "latitude": 41.24060321,
  "time": "2020-05-30T18:25:00.511Z",
  "duration": 15
}
```

Follow the links below for more information on how to setup and configure the SafePlaces.

- [SafePlaces Docs Home](https://github.com/Path-Check/safeplaces-docs/tree/master)
- [Databases](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/databases)
- [Setting Up SafePlaces Translation Service](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/setup#setting-up-safeplaces-translation-service)
- [Environment Variables](https://github.com/Path-Check/safeplaces-docs/blob/master/safeplaces-backend-services/environment-variables/safeplaces-translation-service.md)
- [Authentication](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/authentication)
- [User Account & Organization Setup](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/accounts-configuration)
- [Publishing Location Data](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/published-data)
- [Security Recommendations](https://github.com/Path-Check/safeplaces-docs/tree/master/safeplaces-backend-services/security)
