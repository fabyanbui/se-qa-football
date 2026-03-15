const TournamentModel = require('../models/tournament.m.js');

function setTournamentContext(req, res, tournament) {
  req.tournament = tournament;
  res.locals.tournament = tournament;
  res.locals.tournamentBasePath = `/tournament/${tournament.id}`;
}

function getQueryString(req) {
  const queryIndex = req.originalUrl.indexOf('?');
  if (queryIndex === -1) {
    return '';
  }
  return req.originalUrl.slice(queryIndex);
}

async function getCurrentActiveTournament() {
  const tournament = await TournamentModel.getCurrentTournament();
  if (!tournament || tournament.isClosed) {
    return null;
  }
  return tournament;
}

async function checkTournament(req, res, next) {
  const tournament = await getCurrentActiveTournament();
  if (!tournament) {
    if (req.method === 'GET') {
      return res.redirect('/create');
    }
    return res.status(400).json({ status: 'error', message: 'Không có giải đấu đang hoạt động.' });
  }
  setTournamentContext(req, res, tournament);
  return next();
}

async function checkTournamentContext(req, res, next) {
  const tournamentId = Number.parseInt(req.params.tournamentId, 10);
  if (!Number.isInteger(tournamentId)) {
    if (req.method === 'GET') {
      return res.redirect('/tournament');
    }
    return res.status(404).json({ status: 'error', message: 'Mã giải đấu không hợp lệ.' });
  }

  const tournament = await TournamentModel.getTournamentById(tournamentId);
  if (!tournament || tournament.isClosed) {
    if (req.method === 'GET') {
      return res.redirect('/tournament');
    }
    return res.status(404).json({ status: 'error', message: 'Không tìm thấy giải đấu đang hoạt động.' });
  }

  setTournamentContext(req, res, tournament);
  return next();
}

async function checkCreatedTournament(req, res, next) {
  const createdTournamentId = Number.parseInt(req.session?.createdTournamentId, 10);
  if (!Number.isInteger(createdTournamentId)) {
    return res.status(400).json({ status: 'error', message: 'Không tìm thấy giải đấu vừa tạo.' });
  }

  const tournament = await TournamentModel.getTournamentById(createdTournamentId);
  if (!tournament || tournament.isClosed) {
    if (req.session) {
      req.session.createdTournamentId = null;
    }
    return res.status(404).json({ status: 'error', message: 'Không tìm thấy giải đấu để tải ảnh.' });
  }

  setTournamentContext(req, res, tournament);
  return next();
}

function redirectToCurrentTournamentPath(pathResolver) {
  return async function (req, res) {
    const tournament = await getCurrentActiveTournament();
    if (!tournament) {
      return res.redirect('/create');
    }
    const pathSuffix = typeof pathResolver === 'function' ? pathResolver(req) : (pathResolver || '');
    return res.redirect(`/tournament/${tournament.id}${pathSuffix}${getQueryString(req)}`);
  };
}

module.exports = {
  checkTournament,
  checkTournamentContext,
  checkCreatedTournament,
  redirectToCurrentTournamentPath,
  checkNoTournament: async function (req, res, next) {
    const countActive = await TournamentModel.countActive();
    if (countActive > 0) {
      return res.redirect('/');
    }
    return next();
  },
};
