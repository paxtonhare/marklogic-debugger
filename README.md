# Marklogic Debugger

A stand alone debugger for MarkLogic Server. Simply download the war and run it. Then point to your MarkLogic Server and start debugging. Nothing gets installed in MarkLogic.

**_Should_** work with all versions of MarkLogic. Tested with 7, 8, and 9.

## Prerequisites

- You need Java 8 to run the executable war file.

## Using It

Download the war file from the [releases page](https://github.com/paxtonhare/marklogic-debugger/releases).

Run it with:

`java -jar marklogic-debugger.war`

Open your browser to [http://localhost:9999](http://localhost:9999)

##### Changing the port

Want to use a port other than 9999? Run it like this:

`java -jar marklogic-debugger.war --server.port=8090`

### Browser Compatibility

Use Chrome or FireFox or Safari. Not tested in IE.

## Building From Source

Want to contribute? Perhaps you just want to poke the code?

Look at our [CONTRIBUTING.md](https://github.com/paxtonhare/marklogic-debugger/blob/master/CONTRIBUTING.md#building-the-debugger-from-source) file for details on building from source.

## Video Walkthrough

Click below to watch a video walkthrough of using the Debugger (via youtube).
[![IMAGE ALT TEXT](http://img.youtube.com/vi/gehl1hp4Bvw/0.jpg)](http://www.youtube.com/watch?v=gehl1hp4Bvw "Introduction to the MarkLogic Debugger")
