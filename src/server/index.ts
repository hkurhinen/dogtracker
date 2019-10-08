import SearchController from "../common/search-controller"
import express from "express";
import bodyParser from "body-parser";
import moment from "moment";
import { settings } from "../common/settings";

const searchController = new SearchController(settings.elastic.id, settings.elastic.username, settings.elastic.password);
const app = express();

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.post("/trips/start", async (req, res) => {
  try {
    const name = req.body.name;
    if (!name) {
      res.status(400).send("Missing name");
      return;
    }

    await searchController.createTrip(name);
    res.status(201).send();
  } catch(e) {
    res.status(500).send(e);
  }
});

app.post("/trips/finish", async (req, res) => {
  try {
    const name = req.body.name;
    if (!name) {
      res.status(400).send("Missing name");
      return;
    }

    await searchController.finishTrip(name);
    res.status(201).send();
  } catch(e) {
    res.status(500).send(e);
  }
});

app.get("/trips/:name", async (req, res) => {
  try {
    const trips = await searchController.listTrips(req.params.name);
    res.send(trips.map((trip: any) => trip._source));
  } catch(e) {
    res.status(500).send(e);
  }
});

app.get("/traces/:name", async (req, res) => {
  try {
    const start = moment(req.query.start, "x");
    const end = moment(req.query.end, "x");
    if (!start.isValid() || !end.isValid()) {
      res.status(400).send("Invalid start or end parameters");
      return;
    }

    const traces = await searchController.listTraces(req.params.name, start.toDate(), end.toDate());
    res.send(traces.map((trace: any) => trace._source));
  } catch(e) {
    res.status(500).send(e);
  }
});

app.listen(settings.port, () => console.log(`Dog tracker listening on port ${settings.port}`));