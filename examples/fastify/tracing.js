import opentelemetry from '@opentelemetry/api';

import { CollectorTraceExporter } from '@opentelemetry/exporter-collector';
import Instrumentation from '@opentelemetry/instrumentation';
import OtelResources from '@opentelemetry/resources';
import SdkTraceBase from '@opentelemetry/sdk-trace-base';
import SdkTraceNode from '@opentelemetry/sdk-trace-node';
import SemanticConventions from '@opentelemetry/semantic-conventions';

import { FastifyInstrumentation } from '@opentelemetry/instrumentation-fastify';
import OtelHttpInstrumentation from '@opentelemetry/instrumentation-http';

const { registerInstrumentations } = Instrumentation;
const { Resource } = OtelResources;
const { SimpleSpanProcessor } = SdkTraceBase;
const { NodeTracerProvider } = SdkTraceNode;
const { SemanticResourceAttributes } = SemanticConventions;
const { diag, DiagConsoleLogger, DiagLogLevel } = opentelemetry;
const { HttpInstrumentation } = OtelHttpInstrumentation;
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);

function log() {
  // eslint-disable-next-line prefer-rest-params
  const args = Array.from(arguments) || [];
  args.unshift(new Date());
  console.log.apply(this, args);
}

export default serviceName => {
  const provider = new NodeTracerProvider({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: serviceName,
    }),
  });
  const fastifyInstrumentation = new FastifyInstrumentation();
  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      // Fastify instrumentation expects HTTP layer to be instrumented
      HttpInstrumentation,
      fastifyInstrumentation,
    ],
  });

  const exporter = new CollectorTraceExporter();
  provider.addSpanProcessor(new SimpleSpanProcessor(exporter));

  // Initialize the OpenTelemetry APIs to use the NodeTracerProvider bindings
  provider.register({});
  return {
    log,
    fastifyInstrumentation,
    provider,
    tracer: opentelemetry.trace.getTracer('fastify-example'),
  };
};
