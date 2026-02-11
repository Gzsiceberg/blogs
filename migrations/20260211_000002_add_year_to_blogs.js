const { DataTypes } = require('sequelize')

const constraintName = 'blogs_year_range_check'

const hasColumn = async (queryInterface, tableName, columnName) => {
  const definition = await queryInterface.describeTable(tableName)
  return Boolean(definition[columnName])
}

module.exports = {
  up: async ({ context: queryInterface }) => {
    const currentYear = new Date().getFullYear()

    if (!(await hasColumn(queryInterface, 'blogs', 'year'))) {
      await queryInterface.addColumn('blogs', 'year', {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: currentYear
      })
    }

    await queryInterface.sequelize.query(`
      ALTER TABLE blogs
      ADD CONSTRAINT ${constraintName}
      CHECK (
        year >= 1991
        AND year <= EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER
      );
    `)
  },

  down: async ({ context: queryInterface }) => {
    await queryInterface.removeConstraint('blogs', constraintName)

    if (await hasColumn(queryInterface, 'blogs', 'year')) {
      await queryInterface.removeColumn('blogs', 'year')
    }
  }
}
