import SearchController from "../common/search-controller";
import CoordinateController from "./coordinate-controller";
import { settings } from "../common/settings";
import { Point } from "../common/types";

const searchController = new SearchController(settings.elastic.id, settings.elastic.username, settings.elastic.password);
const coordinateController = new CoordinateController(settings.device);
coordinateController.on("coordinates", (coordinates: Point) => {
  searchController.createTrace(settings.dog, coordinates).catch(e => console.error("Error indexing point", e));
});