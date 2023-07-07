// eslint-disable-next-line
import opentelemetry from '@opentelemetry/api';
import axios from 'axios';
import fastifyExpress from 'fastify-express';
import Tracing from './tracing.js';

const tracing = Tracing('example-fastify-server');

const Fastify = await import('fastify');

const { context, trace } = opentelemetry;

const PORT = 8080;
const app = Fastify.fastify({ logger: true });
app.register(fastifyExpress).register(subsystem);

async function subsystem(fastify) {
  fastify.addHook('onRequest', async () => {
    const span = trace.getSpan(context.active());
    span.setAttribute('order', 2);
  });

  // eslint-disable-next-line prefer-arrow-callback
  fastify.addHook('onRequest', async function onRequestHook() {
    const span = trace.getSpan(context.active());
    span.setAttribute('order', 3);

    const newSpan = tracing.tracer.startSpan('foo');
    newSpan.setAttribute('foo', 'bar');
    newSpan.end();
  });

  fastify.use((req, res, next) => {
    const span = trace.getSpan(context.active());
    span.setAttribute('order', 1);
    next();
  });

  fastify.post('/run_test2/:id', async (req, res) => {
    const span = trace.getSpan(context.active());
    span.setAttribute('order', 4);

    const result = await axios.get(
      'https://raw.githubusercontent.com/open-telemetry/opentelemetry-js/main/package.json'
    );
    const result2 = await axios.get(
      'https://raw.githubusercontent.com/open-telemetry/opentelemetry-js/main/package.json'
    );

    tracing.log('sending response');
    // throw Error('boom  lala');
    res.send(`OK ${result.data.version} ${result2.data.version}`);
  });

  fastify.addHook('onRequest', (req, reply, done) => {
    const span = trace.getSpan(context.active());
    console.log('first', span);
    console.log('kuku1');
    span.setAttribute('kuku1', 'lala');

    setTimeout(() => {
      console.log('kuku2');
      span.setAttribute('kuku2', 'lala');
      const newSpan = tracing.tracer.startSpan('tada');
      newSpan.end();

      reply.send('foo');
      done();
    }, 2000);
  });
}

app.post('/run_test/:id', async (req, res) => {
  const result = await axios.get(
    'https://raw.githubusercontent.com/open-telemetry/opentelemetry-js/main/package.json'
  );
  tracing.log('sending response');
  res.send(`OK ${result.data.version}`);
});

app.listen(PORT);
