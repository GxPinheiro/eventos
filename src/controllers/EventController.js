const Event = require('../models/Event');
const User = require('../models/User');

module.exports = {
  async index(req, res) {
    // O sort no find ordena por data de criação
    // O ' - ' antes do parametro é para inverter a ordenação
    const events = await Event.find({}).sort("-createdAt");

    return res.json(events);
  },

  async store(req, res) {

    var message = validation(req);

    if (message) {
      return res.json(message);
    }

    var event = req.body;

    User.findOne({email: req.headers.email}, function(err, user) {

      event.createdBy = user.id;

      event = Event.create(req.body);

      //envia um evento para todos que estão conectados na aplicação
      //esse evento é a criação de um novo event
      req.io.emit('event', event);
    });

    return res.json(event);
  },

  async update(req, res) {

    const event = await Event.findById(req.params.id);
    var message = validation(req);

    if (message) {
      return res.json(message);
    }

    event.set(req.body);
    await event.save();

    return res.json(event);
  },

  async participate(req, res) {

    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.json("Não encontrou o evento informado");
    }

    const user = await User.findOne({email: req.headers.email});

    await Event.find({confirmedUsers: user.id}, function(err, eventsList) {

      if (eventsList) {
        eventsList.forEach(function(eventElement) {
          if (eventElement.id === req.params.id) {
            return res.json("Você já está participando deste evento");
          }
        });
      }

      event.confirmedUsers.push(user.id);
      event.set({
        confirmCont: event.confirmCont +1,
        confirmedUsers: event.confirmedUsers
      });

      event.save();

      req.io.emit('participate', event);
      // return res.json(event);
      return res.json("Se inscreveu com sucesso");
    });

  },

  async delete(req, res) {
    const event = await Event.findById(req.params.id);

    event.delete();

    return res.json("Evento excluído com sucesso");
  },
};

function validation(req) {

  if (!req.body.name) {
    return "O nome do evento não pode ser vazio";
  }

  if (!req.body.category) {
    return "Você precisa informar uma categoria";
  }

  if (!req.body.location) {
    return "Você precisa informar o local do evento";
  }

  if (!req.body.eventDate) {
    return "Você precisa informar a data do evento";
  }
}
