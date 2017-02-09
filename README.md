# MarklogicDebugger

A stand alone debugger for MarkLogic Server. Simply download the war and run it. Then point to your MarkLogic Server and start debugging.

## Using It

Download the war file from the [releases page](https://github.com/paxtonhare/marklogic-debugger/releases).

Run it with:

`java -jar marklogic-debugger.war`

Open your browser to [http://localhost:8080](http://localhost:8080)

##### Changing the port

Want to use a port other than 8080? Run it like this:

`java -jar marklogic-debugger.war --server.port=8090`

## Building From Source

Want to contribute? Perhaps you just want to poke the code?

Look at our [CONTRIBUTING.md](https://github.com/paxtonhare/marklogic-debugger/blob/master/CONTRIBUTING.md#building-the-debugger-from-source) file for details on building from source.
