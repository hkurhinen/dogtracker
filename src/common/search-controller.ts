import { Client } from "@elastic/elasticsearch";
import { Point, TRACE_INDEX, TRIP_INDEX } from "../common/types";

interface indexConfig {
  name: string,
  mappings: object
}

const INDEX_CONFIGS: indexConfig[] = [
  {
    name: TRACE_INDEX,
    mappings: {
      properties: {
        name: { type: "keyword"},
        location: { type: "geo_point"},
        time: { type: "date"}
      }
    }
  },{
    name: TRIP_INDEX,
    mappings: {
      properties: {
        name: { type: "keyword"},
        status: { type: "keyword" },
        start: { type: "date"},
        end: { type: "date"}
      }
    }
  }
]

/**
 * Class that handles search functions
 */
export default class SearchController {
  private client: Client;

  /**
   * Initializes client that is used to connect to elasticsearch
   * 
   * @param id Elastic cloud id
   * @param username Elastic cloud username
   * @param password Elastic cloud password
   */
  constructor(id: string, username: string, password: string) {
    this.client = new Client({
      cloud: {
        id: id,
        username: username,
        password: password
      }
    });
    this.verifyIndices().catch((e) => {
      console.error("Error verifying indices", e);
    });
  }

  /**
   * Lists trips
   */
  public listTrips = async (name: string) => {
    const { body } = await this.client.search({
      index: TRIP_INDEX,
      body: {
        sort: [
          { start: { order: "desc"}},
        ],
        query: {
          match: { name: name }
        }
      }
    });
  
    const trips = body && body.hits && body.hits.hits && body.hits.hits ? body.hits.hits : [];
    return trips;
  }

  /**
   * Lists traces
   */
  public listTraces = async (name: string, start: Date, end: Date) => {
    const { body } = await this.client.search({
      index: TRACE_INDEX,
      body: {
        sort: [
          { time: { order: "asc"}},
        ],
        query: {
          bool : {
            must : [
              {
                match: { 
                  name: name
                }
              }, {
                range : {
                  time : {
                    gte : start.getTime(),
                    lte : end.getTime()
                  }
                }
              }
            ]
          }
        }
      }
    });

    const traces = body && body.hits && body.hits.hits && body.hits.hits ? body.hits.hits : [];
    return traces;
  }

  /**
   * Creates new trace
   */
  public createTrace = async (name: string, point: Point) => {
    this.client.index({
      index: TRACE_INDEX,
      body: {
        name: name,
        location: point,
        time: new Date().getTime()
      }
    });
  }

  /**
   * Creates new trip, throws error if trip is already in progress
   */
  public createTrip = async (name: string) => {
    const trip = await this.findOnGoingTrip(name);
    if (trip) {
      throw new Error("Trip is already on going");
    }

    await this.client.index({
      index: TRIP_INDEX,
      body: {
        name: name,
        status: "ONGOING",
        start: new Date().getTime()
      }
    });
  }

  /**
   * Finished trip, throws error if not ready
   */
  public finishTrip = async (name: string) => {
    const trip = await this.findOnGoingTrip(name);
    if (!trip) {
      throw new Error("Trip is not started");
    }

    await this.client.update({
      id: trip._id,
      index: TRIP_INDEX,
      body: {
        doc: {
          status: "DONE",
          end: new Date().getTime()
        }
      }
    });
  }

  /**
   * Finds ongoing trip, returns trip or null if not found
   */
  private findOnGoingTrip = async (name: string) => {
    const { body } = await this.client.search({
      index: TRIP_INDEX,
      body: {
        query: {
          bool : {
            must : [
              {
                match: {
                  name: name
                }
              },
              {
                match: {
                  status: "ONGOING"
                }
              }
            ]
          }
        }
      }
    });
  
    const trip = body && body.hits && body.hits.hits && body.hits.hits.length > 0 ? body.hits.hits[0] : null;
    return trip;
  }

  /**
   * Verifies that configured indices exist
   */
  private verifyIndices = async() => {
    for(let i = 0; i < INDEX_CONFIGS.length; i++) {
      await this.vefiryIndex(INDEX_CONFIGS[i].name, INDEX_CONFIGS[i].mappings);
    }
  }

  /**
   * Verifies that index exists and creates it if it doens't
   */
  private vefiryIndex = async(indexName: string, mappingConfig: object) => {
    const indiceExitsResponse = await this.client.indices.exists({index: indexName}); 
    const indiceExists = indiceExitsResponse.statusCode === 200;
    if (!indiceExists) {
      await this.client.indices.create({ index: indexName });
      await this.client.indices.putMapping({
        index: indexName,
        body: mappingConfig
      });
    } else {
      console.log(`Index with name ${indexName} already exists`);
    }
  }
}