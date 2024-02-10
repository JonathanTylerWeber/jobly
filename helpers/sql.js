const { BadRequestError } = require("../expressError");

/**
 * Construct SQL `SET` clause and parameter values for a partial update query.
 * 
 * Given an object containing data to update and a mapping of JavaScript keys to
 * corresponding SQL column names, this function generates the SQL `SET` clause
 * and extracts the parameter values for the query.
 * 
 * Example:
 * 
 *    const dataToUpdate = {
 *      firstName: 'John',
 *      age: 30,
 *    };
 * 
 *    const jsToSql = {
 *      firstName: 'first_name',
 *      age: 'age',
 *    };
 * 
 *    const { setCols, values } = sqlForPartialUpdate(dataToUpdate, jsToSql);
 *    // setCols: '"first_name"=$1, "age"=$2'
 *    // values: ['John', 30]
 * 
 * @param {object} dataToUpdate - Object containing data to update.
 * @param {object} jsToSql - Mapping of JavaScript keys to corresponding SQL column names.
 * @returns {object} An object containing the SQL `SET` clause and parameter values.
 * @throws {BadRequestError} If the data to update is empty.
 */

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
    `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
