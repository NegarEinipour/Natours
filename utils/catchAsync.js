module.exports = (fn) => {
  //sit until the express calls this anynonmous function assigned to (like exports.createTour) as soon as someone hits the route
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
