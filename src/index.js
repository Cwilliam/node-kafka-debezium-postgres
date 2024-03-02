const { Kafka } = require('kafkajs')
var request = require('request-promise')

const kafka = new Kafka({
  clientId: 'sample-consumer',
  brokers: ['kafka:9092']
});

const consumer = kafka.consumer({ groupId: 'notification-group' });

const handleMessage = async ({ topic, partition, message }) => {
  console.log(`Received message from topic '${topic}'...`)

  const buffer = Buffer.from(message.value)

  const options = {
    method: 'POST',
    uri: 'YOUR ENDPOINT HERE',
    body: {
      topic,
      partition,
      message: JSON.parse(buffer)
    },
    json: true
  }

  // Send the message to the endpoint
  await request.post(options)

  await consumer.commitOffsets([{ topic, partition, offset: message.offset }])
  console.log(`Message committed to offset ${message.offset}...`)
}

const runConsumer = async () => {
  await consumer.connect()

  // every time a new topic is added, the consumer must be subscribed to it
  await consumer.subscribe({ topic: 'postgres.public.student' })
  await consumer.subscribe({ topic: 'postgres.public.room' })

  console.log('Consumer subscribed to topics...')

  await consumer.run({
    eachMessage: handleMessage,
  })
}

runConsumer()
  .then(() => { console.log('Consumer is running...') })
  .catch((error) => { console.error('Failed to run kafka consumer', error) })