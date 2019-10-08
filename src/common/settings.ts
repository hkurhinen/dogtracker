import nconf from "nconf";

nconf.argv()
  .env()
  .file({ file: 'config.json' });

export const settings = {
  elastic: {
    id: nconf.get("elastic:id"),
    username: nconf.get("elastic:username"),
    password: nconf.get("elastic:password")
  },
  dog: nconf.get("dog"),
  device: nconf.get("device"),
  port: nconf.get("port")
};