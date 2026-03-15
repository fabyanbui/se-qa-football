const multer = require('multer');
const fs = require('fs');

async function resolveTournamentId(req) {
  if (req.params?.tournamentId) {
    return req.params.tournamentId;
  }
  if (req.tournament?.id) {
    return req.tournament.id;
  }
  if (req.session?.createdTournamentId) {
    return req.session.createdTournamentId;
  }
  return null;
}

const storage = multer.diskStorage({
  destination: async function (req, file, callback) {
    const tournamentId = await resolveTournamentId(req);
    if (!tournamentId) {
      return callback(new Error('Không xác định được giải đấu để lưu logo.'));
    }
    const path = `./public/img/tournaments/${tournamentId}`;
    fs.mkdirSync(path, { recursive: true });
    callback(null, path);
  },
  filename: function (req, file, callback) {
    const extension = file.mimetype.split('/')[1];
    callback(null, `logo.${extension}`);
  },
});
const upload = multer({ storage: storage });

module.exports = upload;
